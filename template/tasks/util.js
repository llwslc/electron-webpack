
const exec = require('child_process').exec;
const fs = require('fs');
const platform = require('os').platform();
const iconv = require('iconv-lite');

let styles = {
  bold          : ['\x1B[1m',  '\x1B[22m'],
  italic        : ['\x1B[3m',  '\x1B[23m'],
  underline     : ['\x1B[4m',  '\x1B[24m'],
  inverse       : ['\x1B[7m',  '\x1B[27m'],
  black         : ['\x1B[30m', '\x1B[39m'],
  red           : ['\x1B[31m', '\x1B[39m'],
  green         : ['\x1B[32m', '\x1B[39m'],
  yellow        : ['\x1B[33m', '\x1B[39m'],
  blue          : ['\x1B[34m', '\x1B[39m'],
  magenta       : ['\x1B[35m', '\x1B[39m'],
  cyan          : ['\x1B[36m', '\x1B[39m'],
  white         : ['\x1B[37m', '\x1B[39m'],
  redBG         : ['\x1B[41m', '\x1B[49m'],
  greenBG       : ['\x1B[42m', '\x1B[49m'],
  yellowBG      : ['\x1B[43m', '\x1B[49m'],
  blueBG        : ['\x1B[44m', '\x1B[49m'],
  magentaBG     : ['\x1B[45m', '\x1B[49m'],
  cyanBG        : ['\x1B[46m', '\x1B[49m'],
  whiteBG       : ['\x1B[47m', '\x1B[49m'],
  grey          : ['\x1B[90m', '\x1B[39m'],
  end           : ['\x1b[0m']
};

let RED = styles.red[0];
let YELLOW = styles.yellow[0];
let BLUE = styles.blue[0];
let RED_BG = styles.redBG[0];
let END = styles.end[0];

var Encoding = 'utf8';
if (platform === 'win32')
{
  Encoding = 'GBK';
}

let hotEnv = 'cross-env NODE_ENV=developmentHot';
let packEnv = 'cross-env NODE_ENV=developmentPack';
let rlsEnv = 'cross-env NODE_ENV=production';

var repeat = function (str, times)
{
  return (new Array(times + 1)).join(str);
};

var format = function (pre, data, col)
{
  if (!!!col) col = YELLOW;

  data = data.replace(/\n$/g, '');
  data = data.replace(/\x08/g, '');
  data = data.replace(/^\x20+/g, '');
  data = data.replace(/\n/g, '\n' + repeat(' ', pre.length + 2));
  // for webpack compiling log
  data = data.replace(/([0-9]+%)/g, '\n' + repeat(' ', pre.length + 2) + '$1');
  data = data.replace(/^\n\x20+/g, '');

  var decodedBody = iconv.decode(Buffer(data, 'binary'), Encoding);

  return decodedBody;
};

var logFormat = function (pre, data, col)
{
  var log = format(pre, data, col);
  if (!!log)
  {
    console.log(`${col}${pre}${END}  ${log}`);
  }
};

var errFormat = function (pre, data, col)
{
  var errPre = pre + '  !!!';
  var log = format(errPre, data, col);
  if (!!log)
  {
    console.log(`${col}${pre}${END}  ${RED_BG}!!!${END}  ${log}`);
  }
};

var colFormat = function (data, col)
{
  if (!!!col) col = END;
  console.log(`${col}${data}${END}`);
};

var execAsync = function (pre, cmd, col, cb)
{
  let child = exec(cmd, {encoding: 'binary'});
  child.stdout.on('data', data => logFormat(pre, data, col));
  child.stderr.on('data', data => errFormat(pre, data, col));
  child.on('exit', code => {
    if (code != 0)
    {
      cb(`code : ${code}\nerror cmd: ${cmd}`, null);
    }
    else
    {
      cb(null, null);
    }
  });
};

var copyAsync = function (source, target, cb)
{
  var writer = fs.createWriteStream(target);
  var reader = fs.createReadStream(source);
  reader.pipe(writer);
  writer.on(`finish`, () => {
    colFormat(`copy ${source} to ${target} finish`);
    cb(null, null);
  });
};


module.exports = { RED, YELLOW, BLUE, logFormat, errFormat, colFormat, execAsync, copyAsync, hotEnv, packEnv, rlsEnv };
