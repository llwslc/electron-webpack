
const fs = require('fs');
const os = require('os');
const platform = os.platform();
const arch = os.arch();
const async = require('async');
const util = require('../util');
const pkgInfo = require('../../app/package.json');


var installer = function ()
{
  var self = this;


  self.appFileName = `${pkgInfo.name}-${platform}-${arch}`;
  self.appFilePath = `./packages/${self.appFileName}`;
  self.appContentsPath = `${self.appFilePath}/${pkgInfo.name}.app`;
  self.targetName = `${self.appFileName}-v${pkgInfo.version}`;

  self.createDmg = function (callback)
  {
    util.colFormat('Create dmg...\n');

    var rwDmgPath = `${self.appFilePath}/../rw.dmg`;
    var ultDmgPath = `${self.appFilePath}/../${self.targetName}.dmg`;
    var volumesPath = `/Volumes/${pkgInfo.name}`;

    var dmgExecAsync = function (cmd, cb)
    {
      util.execAsync('dmg', cmd, util.BLUE, cb);
    }

    async.waterfall([
      function (cb)
      {
        dmgExecAsync(`rm -f ${self.appFilePath}/LICENSE`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`rm -f ${self.appFilePath}/LICENSES.chromium.html`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`rm -f ${self.appFilePath}/version`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`rm -f ${self.appFilePath}/Applications && ln -s /Applications ${self.appFilePath}/Applications`, cb);
      },
      function (res, cb)
      {
        if (!fs.existsSync(`${self.appFilePath}/.background`))
        {
          fs.mkdirSync(`${self.appFilePath}/.background`);
        }
        cb (null, null);
      },
      function (res, cb)
      {
        util.copyAsync(`./tasks/mac/background.png`, `${self.appFilePath}/.background/background.png`, cb);
      },
      function (res, cb)
      {
        util.copyAsync(`./app/icons/icon.icns`, `${self.appFilePath}/.volumeIcon.icns`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`rm -f ${rwDmgPath} && rm -f ${ultDmgPath}`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`hdiutil create -srcfolder ${self.appFilePath} -volname ${pkgInfo.name} -fs HFS+ -fsargs "-c c=64,a=16,e=16" -format UDRW ${rwDmgPath}`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`(test -d ${volumesPath} && hdiutil detach ${volumesPath}) || :`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`hdiutil attach -readwrite -noverify -noautoopen ${rwDmgPath}`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`SetFile -c icnC ${volumesPath}/.volumeIcon.icns`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`SetFile -a C ${volumesPath}`, cb);
      },
      function (res, cb)
      {
        var bgWidth = 550;
        var bgHeigth = 310;
        var appX = 143;
        var appY = 157;
        var dropX = 407;
        var dropY = 157;
        var iconSize = 128;
        var textSize = 16;

        var AppleScriptStr = `
          tell application "Finder"
            tell disk "${pkgInfo.name}"

              open

              set titleHeight to 20
              set windowWidth to ${bgWidth}
              set windowHeight to ${bgHeigth}

              tell container window
                  set current view to icon view
                  set toolbar visible to false
                  set statusbar visible to false
                  set the bounds to {0, 0, windowWidth, (windowHeight + titleHeight)}
                  set position of every item to {0, windowHeight * 2}
                  set position of item "${pkgInfo.name}.app" to {${appX}, ${appY}}
                  set position of item "Applications" to {${dropX}, ${dropY}}
              end tell

              set opts to the icon view options of container window
              tell opts
                  set icon size to ${iconSize}
                  set text size to ${textSize}
                  set arrangement to not arranged
              end tell

              set background picture of opts to file ".background:background.png"

              close

              --give the finder some time to write the .DS_Store file
              delay 3

              set dsStore to "${volumesPath}/.DS_STORE"
              set waitTime to 0
              set ejectMe to false
              repeat while ejectMe is false
                  delay 1
                  set waitTime to waitTime + 1

                  if (do shell script "[ -f " & dsStore & " ]; echo $?") = "0" then set ejectMe to true
              end repeat
              log "waited " & waitTime & " seconds for .DS_STORE to be created."

            end tell
          end tell`;
        dmgExecAsync(`osascript -e '${AppleScriptStr}'`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`hdiutil detach ${volumesPath}`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`hdiutil convert ${rwDmgPath} -format UDZO -imagekey zlib-level=9 -o ${ultDmgPath}`, cb);
      },
      function (res, cb)
      {
        dmgExecAsync(`rm -f ${rwDmgPath}`, cb);
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

    var zipFilePath = `../../${self.targetName}-update.zip`;

    util.execAsync(`zip`, `cd ${self.appContentsPath} && zip -ry ${zipFilePath} *`, util.YELLOW, function (err, res)
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
      return;
    }

    async.waterfall([
      function (cb)
      {
        self.createDmg(cb);
      },
      function (res, cb)
      {
        self.createZip(cb);
      },
    ], function (err, res)
    {
      if (err)
      {
        util.colFormat(err, util.RED);
      }
      else
      {
        util.colFormat(`Success create mac installer`);
      }
    });
  };
};


module.exports = installer;
