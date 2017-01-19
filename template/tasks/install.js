
const fs = require('fs');
const exec = require('child_process').exec;
const async = require('async');
const util = require('./util');

var electronVersion = ``;
var buildAddons = `node-gyp rebuild --target=${electronVersion} --arch=x64 --dist-url=https://atom.io/download/atom-shell`

var execFunc = function (cmd, cb)
{
  let child = exec(cmd, {encoding: 'binary'});
  child.stdout.on('data', data => util.logFormat(`bash`, data, util.BLUE));
  child.stderr.on('data', data => util.errFormat(`bash`, data, util.BLUE));
  child.on('exit', code => {
    if (code != 0) {
      cb(`\x1B[41m error: ${cmd} \x1B[0m`, null);
    } else {
      cb(null, null);
    }
  });
};

var copyFunc = function (source, target, cb)
{
  var writer = fs.createWriteStream(target);
  var reader = fs.createReadStream(source);
  reader.pipe(writer);
  writer.on(`finish`, () => {
    util.colFormat(`copy ${source} finish`);
    cb(null, null);
  });
};

async.waterfall([
  function (cb)
  {
    exec(`electron -v`, (error, stdout, stderr) => {
      if (error)
      {
        cb(error, null);
      }
      else
      {
        electronVersion = stdout.match(/\d+.\d+.\d+/g);
        buildAddons = `node-gyp rebuild --target=${electronVersion[0]} --arch=x64 --dist-url=https://atom.io/download/atom-shell`;
        cb(null, null)
      }
    });
  },
  function (res, cb)
  {
    execFunc(`npm i serialport --build-from-source`, cb);
  },
  function (res, cb)
  {
    execFunc(`cd node_modules/serialport && ${buildAddons}`, cb);
  },
  function (res, cb)
  {
    execFunc(`cd ../../NativeAddonProjectDir && ${buildAddons}`, cb);
  },
  function (res, cb)
  {
    copyFunc(`../../NativeAddonProjectDir/build/Release/NativeAddonProject.node`, `node_modules/NativeAddonProject.node`, cb);
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
