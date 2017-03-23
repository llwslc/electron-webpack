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

  self.name = pkgInfo;
  self.version = pkgInfo.version;
  self.platform = os.platform();

  self.feedURL = '';
  self.updateURL = '';
  self.updateMD5 = '';
  self.updatePath = '';

  self.updateButtons = [];
  self.updateMessage = '';

  if (self.platform === 'win32')
  {
    self.updateButtons = ['重启升级', '取消'];
    self.updateMessage = '点击"重启升级"后即可完成升级!';
    self.updateResponse = 0;

    self.updatePath = `${path.join(process.argv[0], '..', 'update.zip')}`;
  }
  else if (self.platform === 'darwin')
  {
    self.updateButtons = ['取消', '重启升级'];
    self.updateMessage = '发现新版本, 点击"重启升级"后即可完成升级!';
    self.updateResponse = 1;

    self.updatePath = `${path.join(process.argv[0], '../../..', 'update.zip')}`;
  }
  else
  {
  }

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

          if (!/^application\/json/.test(contentType))
          {
            cb(statusCode, null);
          }

          response.setEncoding('utf8');
          var rawData = '';
          response.on('data', (chunk) => rawData += chunk);
          response.on('end', function ()
          {
            try
            {
              var parsedData = JSON.parse(rawData);
              self.updateURL = parsedData.url;
              self.updateMD5 = parsedData.md5;

              cb(null, null);
            }
            catch (e)
            {
              cb(statusCode, null);
            }
          });
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
            if (!/^application\/zip/.test(contentType))
            {
              cb(statusCode, null);
            }
            else
            {
              response.pipe(fs.createWriteStream(self.updatePath));

              response.on('end', function ()
              {
                cb(null, null);
              });
            }
          }
        });
      }
    ],(err, res) => {});
  };

  self.quitAndInstall = function ()
  {
    var exec = childProcess.exec;
    if (self.platform === 'win32')
    {
      var updateExePath = './update.exe';
      if (fs.existsSync(updateExePath))
      {
        exec(`start ${updateExePath} ${pkgInfo.name} ${process.pid}`, {encoding: 'binary'});
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


module.exports = { UpdateObj };
