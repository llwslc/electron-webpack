
global.fs = require('fs');
global.path = require('path');
global.readline = require('readline');

global.async = require('async');

if (process.env.NODE_ENV === 'developmentHot') {
  global.__non_webpack_require__ = require;
}

global.NaiveAddonObj = __non_webpack_require__('NaiveAddon.node');

process.on("message", function (msg)
{
    process.send(true);
});

