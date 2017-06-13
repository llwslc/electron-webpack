'use strict'

const electron = require('electron');
const app = electron.app;
const dialog = electron.dialog;
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const childProcess = require('child_process');
const async = require('async');
const pkgInfo = require('./package.json');

var UpdateObj = function ()
{
  var self = this;

  self.name = pkgInfo.name;
  self.version = pkgInfo.version;
  self.platform = os.platform();

  self.feedURL = '';
  self.updateURL = '';
  self.updateVer = '';
  self.updateMD5 = '';
  self.updatePath = '';

  self.getVerNum = function (ver)
  {
    var verArr = ver.split('.');
    var num = 0;
    num += parseInt(verArr[0]) * 1000 * 1000;
    num += parseInt(verArr[1]) * 1000;
    num += parseInt(verArr[2]);
    return num;
  };

  self.cleanup = function (ver)
  {
    var needCleanup = false;
    var curVer = self.getVerNum(self.version);
    var fileVer = self.getVerNum(ver);

    if (fileVer <= curVer)
    {
      needCleanup = true;
    }

    return needCleanup;
  };

  self.updateButtons = [];
  self.updateMessage = '发现新版本, 点击"重启升级"后即可完成升级!';

  if (self.platform === 'win32')
  {
    self.updateButtons = ['重启升级', '取消'];
    self.updateResponse = 0;

    self.appDataDir = path.join(process.env.APPDATA, pkgInfo.name);
    if (!fs.existsSync(self.appDataDir))
    {
      fs.mkdirSync(self.appDataDir)
    }
  }
  else if (self.platform === 'darwin')
  {
    self.updateButtons = ['取消', '重启升级'];
    self.updateResponse = 1;

    self.appDataDir = path.join(process.argv[0], '../../..');
  }
  else
  {
  }

  var files = fs.readdirSync(self.appDataDir);
  files.forEach(function (file, index)
  {
    if (/^update_v([\d.]+)\.(exe|zip)$/.test(file))
    {
      var exeVersion = path.basename(file, path.extname(file)).split('_v')[1];
      var filePath = path.join(self.appDataDir, file);

      if(self.cleanup(exeVersion))
      {
        fs.unlinkSync(filePath);
      }
      else
      {
        self.updatePath = filePath;
      }
    }
  });

  self.setFeedURL = function (url)
  {
    self.feedURL = url;
  };

  self.getFeedURL = function ()
  {
    return self.feedURL;
  };

  self.checkLocalUpdates = function ()
  {
    if (fs.existsSync(self.updatePath))
    {
      dialog.showMessageBox({
        type: 'none',
        buttons: self.updateButtons,
        title: '发现新版本',
        message: self.updateMessage,
      }, function(response)
      {
        if (response == self.updateResponse)
        {
          self.quitAndInstall();
        }
      })
    }
    else
    {
      self.checkServerUpdates();
    }
  };

  self.checkServerUpdates = function ()
  {
    async.waterfall([
      function (cb)
      {
        var url = `${self.feedURL}/update?`;
        url += `platform=${self.platform}&`;
        url += `version=${self.version}&`;
        url += `app=${self.name}`;

        var request = http.get(url, function (response)
        {
          var statusCode = response.statusCode;
          var contentType = response.headers['content-type'];

          if (statusCode != 200)
          {
            cb(statusCode, null);
          }
          else
          {
            if (!/^application\/json/.test(contentType))
            {
              cb(statusCode, null);
            }
            else
            {
              response.setEncoding('utf8');
              var rawData = '';
              response.on('data', (chunk) => rawData += chunk);
              response.on('end', function ()
              {
                try
                {
                  var parsedData = JSON.parse(rawData);
                  self.updateURL = parsedData.url;
                  self.updateVer = parsedData.version;
                  self.updateMD5 = parsedData.md5;

                  cb(null, null);
                }
                catch (e)
                {
                  cb(statusCode, null);
                }
              });
            }
          }
        }).on('error', function (err)
        {
          cb(err, null);
        });
      },
      function (res, cb)
      {
        var request = http.get(self.updateURL, function (response)
        {
          var statusCode = response.statusCode;
          var contentType = response.headers['content-type'];

          if (statusCode != 200)
          {
            cb(statusCode, null);
          }
          else
          {
            var downloadFlag = false;
            if (/^application\/x-msdownload/.test(contentType))
            {
              self.updatePath = path.join(self.appDataDir, `update_v${self.updateVer}.exe`);
              downloadFlag = true;
            }
            else if (/^application\/zip/.test(contentType))
            {
              self.updatePath = path.join(self.appDataDir, `update_v${self.updateVer}.zip`);
              downloadFlag = true;
            }
            else
            {
              cb(statusCode, null);
            }

            if (downloadFlag)
            {
              response.pipe(fs.createWriteStream(self.updatePath));

              response.on('end', function ()
              {
                cb(null, null);
              });
            }
          }
        }).on('error', function (err)
        {
          cb(err, null);
        });
      }
    ],(err, res) => {});
  };

  self.quitAndInstall = function ()
  {
    var exec = childProcess.exec;
    if (self.platform === 'win32')
    {
      if (fs.existsSync(self.updatePath))
      {
        childProcess.spawn(self.updatePath, ['/silent', '/mergetasks=runapp,!desktopicon,!startmenuicon'], {
          detached: true,
          stdio: ['ignore', 'ignore', 'ignore']
        });
        app.exit(0);
      }
      else
      {
        dialog.showErrorBox('升级失败', '升级程序已损坏,请重新下载完整程序安装');
      }
    }
    else if (self.platform === 'darwin')
    {
      var unzip = exec(`unzip -o ${self.updatePath} -d ${path.join(self.updatePath, '..')}`, {encoding: 'binary'});
      unzip.on('exit', function (code)
      {
         exec(`rm ${self.updatePath}`);
         app.relaunch({args: process.argv.slice(1).concat(['--relaunch'])});
         app.exit(0);
      });
    }
    else
    {
      // null
    }
  };
}


module.exports = UpdateObj;
