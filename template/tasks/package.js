
const exec = require('child_process').exec;
const os = require('os');
const platform = os.platform();
const fs = require('fs');
const path = require('path');
const packager = require('electron-packager');
const util = require('./util');

var delDirCmd = '';
var installer = '';

if (platform === 'win32')
{
  delDirCmd = 'rmdir /s/q';
  installer = require('./win/installer.js');
}
else if (platform === 'darwin')
{
  delDirCmd = 'rm -rf';
  installer = require('./mac/installer.js');
}
else
{
  util.colFormat('Unable to determine the current operating system...\n', util.RED);
  return;
}

/**
 * Delete dir
 */
var del = function (mPath, cb)
{
  mPath = path.resolve(__dirname, mPath)
  if (fs.existsSync(mPath))
  {
    if (!fs.statSync(mPath).isDirectory())
    {
      util.colFormat(`${mPath} not directiry!`, util.RED);
      return;
    }
  }
  else
  {
    cb();
    return;
  }

  util.colFormat(`Delete ${mPath} dir...\n`);

  util.execAsync(`delDir`, `${delDirCmd} ${mPath}`, util.BLUE, function (err, res)
  {
    if (!!err)
    {
      util.colFormat(`try run!`, util.RED);
      return;
    }
    else
    {
      cb();
    }
  });
};

/**
 * Build webpack in production
 */
var pack = function ()
{
  del('../app/dist', function ()
  {
    util.execAsync(`webpack`, `${util.rlsEnv} webpack --progress --colors --hide-modules`, util.YELLOW, (err, res) => packageApp());
  });
};

/**
 * Use electron-packager to package electron app
 */
var packageApp = function ()
{
  if (process.argv[2] == 'pack:just')
  {
    return;
  }

  exec('set ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/');

  del('../packages', function ()
  {
    let options = require('../config').building;

    util.colFormat('Building electron app...\n');
    packager(options, function (err, appPaths)
    {
      if (err)
      {
        util.errFormat('electron-packager', 'Error from `electron-packager` when building app...', util.BLUE);
        util.errFormat('electron-packager', err, util.BLUE);
      }
      else
      {
        util.colFormat('');
        util.logFormat('electron-packager', 'Build successful!', util.BLUE);
        util.colFormat('');
{{#if installer}}
        new installer().create();
{{/if}}
      }
    });
  });
};

if (process.argv[2] == 'pack:just')
{
  pack();
}
else if (process.argv[2] == 'package:just')
{
  packageApp();
}
{{#if installer}}
else if (process.argv[2] == 'installer:just')
{
  new installer().create();
}
{{/if}}
else
{
  pack();
}
