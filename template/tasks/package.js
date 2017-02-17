
const exec = require('child_process').exec;
const platform = require('os').platform();
const fs = require('fs');
const path = require('path');
const packager = require('electron-packager');
const util = require('./util');
var delDirCmd = '';

if (platform === 'win32') {
  delDirCmd = 'rmdir /s/q';
} else if (platform === 'darwin') {
  delDirCmd = 'rm -rf';
} else {
  util.colFormat('Unable to determine the current operating system...\n', util.RED);
  return;
}

/**
 * Delete dir
 */
function del (mPath, cb) {
  mPath = path.resolve(__dirname, mPath)
  if (fs.existsSync(mPath)) {
    if(!fs.statSync(mPath).isDirectory()) {
      util.colFormat(`${mPath} not directiry!`, util.RED);
      return;
    }
  } else {
    cb();
    return;
  }

  util.colFormat(`Delete ${mPath} dir...\n`);
  let pack = exec(`${delDirCmd} ${mPath}`, {encoding: 'binary'});

  pack.stdout.on('data', data => util.logFormat(`delDir`, data, util.BLUE));
  pack.stderr.on('data', data => {
    util.errFormat(`delDir`, data, util.BLUE);
    util.logFormat(`tryRun`, `npm run package:just`, util.RED);
  });

  pack.on('exit', code => {
    if (code !== 0) {
      return;
    } else {
      cb();
    }
  });
}

/**
 * Build webpack in production
 */
function pack () {
  del('../app/dist', function () {
    let pack = exec(`${util.rlsEnv} webpack --progress --colors --hide-modules`, {encoding: 'binary'});

    pack.stdout.on('data', data => util.logFormat(`webpack`, data, util.YELLOW));
    pack.stderr.on('data', data => util.errFormat(`webpack`, data, util.YELLOW));
    pack.on('exit', code => packageApp());
  });
}

/**
 * Use electron-packager to package electron app
 */
function packageApp () {
  if (process.argv[2] == 'pack')
  {
    return;
  }

  exec('set ELECTRON_MIRROR=https://npm.taobao.org/mirrors/electron/');

  del('../packages', function () {
    let options = require('../config').building;

    util.colFormat('Building electron app...\n');
    packager(options, (err, appPaths) => {
      if (err) {
        util.errFormat('electron-packager', 'Error from `electron-packager` when building app...', util.BLUE);
        util.errFormat('electron-packager', err, util.BLUE);
      } else {
        util.logFormat('electron-packager', 'Build successful!', util.BLUE);

        util.colFormat('');
        util.logFormat('electron-packager', 'DONE\n\n', util.BLUE);
      }
    });
  });
}

if (process.argv[2] == 'pack')
{
  pack();
}
else if (process.argv[2] == 'package')
{
  packageApp();
}
else
{
  pack();
}
