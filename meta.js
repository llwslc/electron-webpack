'use strict'

module.exports = {
  prompts: {
    name: {
      type: 'string',
      required: true,
      message: 'Application Name'
    },
    description: {
      type: 'string',
      required: false,
      message: 'Project Description',
      default: 'An electron-webpack project'
    },
    companyname: {
      type: 'string',
      required: false,
      message: 'Company Name',
    },
    rebuild: {
      type: 'confirm',
      require: true,
      message: 'Use Native Addons?',
      default: true
    },
    fork: {
      type: 'confirm',
      require: true,
      message: 'Use child_process.fork?',
      default: true
    },
    update: {
      type: 'confirm',
      require: true,
      message: 'Use update framework?',
      default: true
    },
    installer: {
      type: 'confirm',
      require: true,
      message: 'Make installer?',
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
