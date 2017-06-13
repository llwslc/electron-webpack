
const path = require('path');
const os = require('os');
const platform = os.platform();
const arch = os.arch();
const inno = require(`innosetup-compiler`);
const issTemplate = require(`./issTemplate`);
const util = require(`../util`);
const pkgInfo = require('../../app/package.json');


var installer = function ()
{
  var self = this;

  self.appFileName = `${pkgInfo.name}-${platform}-${arch}`;
  self.appIssPath = `.\\packages\\${self.appFileName}.iss`;

  self.create = function ()
  {
    util.colFormat('Create iis...\n');
    new issTemplate(self.appFileName, self.appIssPath);

    inno(self.appIssPath, {}, function (err)
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
  }
};


module.exports = installer;
