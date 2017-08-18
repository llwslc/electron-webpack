
const exec = require('child_process').exec;
const async = require('async');
const util = require('./util');

var electronVersion = ``;
var buildAddons = `node-gyp rebuild --target=${electronVersion} --arch=x64 --dist-url=https://atom.io/download/atom-shell`;

var npmExecAsync = function (cmd, cb)
{
  util.execAsync('npm', cmd, util.BLUE, cb);
};

async.waterfall([
  function (cb)
  {
    exec(`cd .. && electron -v`, (error, stdout, stderr) =>
    {
      if (error)
      {
        cb(error, null);
      }
      else
      {
        electronVersion = stdout.match(/\d+.\d+.\d+/g);
        buildAddons = `node-gyp rebuild --target=${electronVersion[0]} --arch=x64 --dist-url=https://atom.io/download/atom-shell`;
        cb(null, null);
      }
    });
  },
  function (res, cb)
  {
    npmExecAsync(`cd ../../NativeAddonProjectDir && ${buildAddons}`, cb);
  },
  function (res, cb)
  {
    util.copyAsync(`../../NativeAddonProjectDir/build/Release/NativeAddonProject.node`, `node_modules/NativeAddonProject.node`, cb);
  },
], function (err, res)
{
  if (err)
  {
    util.colFormat(err, util.RED);
  }
  else
  {
    util.colFormat(`success install`);
  }
});
