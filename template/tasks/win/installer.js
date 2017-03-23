
const path = require('path');
const os = require('os');
const platform = os.platform();
const arch = os.arch();
const async = require('async');
const VdprojTmpl = require('./vdprojTemplate').vdprojTmpl;
const util = require('../util');
const pkgInfo = require('../../app/package.json');


var installer = function ()
{
  var self = this;

  self.appFileName = `${pkgInfo.name}-${platform}-${arch}`;
  self.appFilePath = `./packages/${self.appFileName}`;
  self.targetName = `${self.appFileName}-v${pkgInfo.version}`;

  self.vsPath = path.join(process.env.VS140COMNTOOLS, `..`, `IDE/devenv.com`);

  self.msiExecAsync = function (cmd, cb)
  {
    util.execAsync('msi', cmd, util.BLUE, cb);
  }

  self.createUpdate = function (callback)
  {
    var vdprojDir = `./tasks/win/update`;
    var vdprojPath = `${vdprojDir}/update.vcxproj`;

    async.waterfall([
      function (cb)
      {
        self.msiExecAsync(`"${self.vsPath}" "${vdprojPath}" /Rebuild "Release"`, cb);
      },
      function (res, cb)
      {
        util.copyAsync(`${vdprojDir}/Release/update.exe`, `${self.appFilePath}/update.exe`, cb);
      },
    ], function (err, res)
    {
      callback(err, null);
    });
  };

  self.createMsi = function (callback)
  {
    util.colFormat('Create msi...\n');

    var msiName = `${self.targetName}.msi`;
    var vdprojDir = `./tasks/win/windowsInstaller`;
    var vdprojPath = `${vdprojDir}/windowsInstaller.vdproj`;

    new VdprojTmpl(self.appFilePath, msiName, vdprojPath);

    async.waterfall([
      function (cb)
      {
        self.msiExecAsync(`"${self.vsPath}" "${vdprojPath}" /Rebuild "Release"`, cb);
      },
      function (res, cb)
      {
        self.msiExecAsync(`del ".\\packages\\setup.exe"`, cb);
      },
    ], function (err, res)
    {
      callback(err, null);
    });
  };

  self.createZip = function (callback)
  {
    util.colFormat('');
    util.colFormat('Create zip...\n');

    var zipFilePath = `../${self.targetName}-update.zip`;
    var zipCmd = `powershell Compress-Archive -path './*' -CompressionLevel Optimal -DestinationPath '${zipFilePath}' -Force`;

    util.execAsync(`zip`, `cd ${self.appFilePath} && ${zipCmd}`, util.YELLOW, function (err, res)
    {
      util.colFormat('');
      util.logFormat('zip', 'DONE', util.YELLOW);
      util.colFormat('');

      callback(err, null);
    });
  };

  self.create = function ()
  {
    if (process.argv[2] == 'package:just')
    {
      self.createUpdate(function (err, res) {});
      return;
    }

    async.waterfall([
      function (cb)
      {
        self.createZip(cb);
      },
      function (res, cb)
      {
        self.createUpdate(cb);
      },
      function (res, cb)
      {
        self.createMsi(cb);
      },
    ], function (err, res)
    {
      if (err)
      {
        util.colFormat(err, util.RED);
      }
      else
      {
        util.colFormat(`Success create win installer`);
      }
    });
  };
};


module.exports = { installer };
