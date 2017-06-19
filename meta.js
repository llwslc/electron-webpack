'use strict'

module.exports = {
  prompts: {
    name: {
      type: 'editor',
      message: 'Application Name'
    },
    description: {
      type: 'editor',
      message: 'Project Description',
      default: 'An electron-webpack project'
    },
    companyname: {
      type: 'editor',
      message: 'Company Name',
    },
    rebuild: {
      type: 'confirm',
      message: 'Use Native Addons (rebuild flag)?',
      default: true
    },
    fork: {
      type: 'confirm',
      message: 'Use child_process.fork (fork flag)?',
      default: true
    },
    update: {
      type: 'confirm',
      message: 'Use update framework (update flag)?',
      default: true
    },
    installer: {
      type: 'confirm',
      message: 'Make installer (installer flag)?',
      default: true
    },
  },
  filters: {
    'tasks/install.js': 'rebuild',
    'app/src/sections/forkJs.js': 'fork',
    'app/update.js': 'update',
    'tasks/mac/*': 'installer',
    'tasks/win/*': 'installer',
  },
  completeMessage: `---

All set. More configurations can be made at \x1b[33m{{destDirName}}/config.js\x1b[0m.

Next steps:
  1.
     \x1B[32mcd {{destDirName}}\x1b[0m
  2.
     \x1B[32mnpm i\x1b[0m
  3.
     If \x1B[1mrebuild\x1b[0m flag is true. Need to be modified at \x1b[33m{{destDirName}}/tasks/install.js\x1b[0m.
     If \x1B[1mfork\x1b[0m flag is true. Need to be modified at \x1b[33m{{destDirName}}/app/src/sections/forkJs.js\x1b[0m.
     If \x1B[1mupdate\x1b[0m flag is true. Need to be modified at \x1b[33m{{destDirName}}/app/electron.js:57 (update.setFeedURL)\x1b[0m.
     If \x1B[1minstaller\x1b[0m flag is true. Need to be modified at \x1b[33m{{destDirName}}/tasks/win/vdprojConfig.json\x1b[0m.
  4.
     \x1B[32mnpm run dev\x1b[0m`
}
