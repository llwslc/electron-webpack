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
      message: 'Project description',
      default: 'An electron-webpack project'
    },
    rebuild: {
      type: 'confirm',
      require: true,
      message: 'Use native addons?',
      default: true
    },
    fork: {
      type: 'confirm',
      require: true,
      message: 'Use child_process.fork?',
      default: true
    },
  },
  filters: {
    'tasks/install.js': 'rebuild',
    'app/src/sections/fork.js': 'fork',
  },
  completeMessage: `---

All set. More configurations can be made at \x1b[33m{{destDirName}}/config.js\x1b[0m.

Next steps:
  1. \x1b[34mcd {{destDirName}}\x1b[0m
  2. \x1b[34mnpm i\x1b[0m
  3. If rebuild flag is true. Need to be modified at \x1b[33m{{destDirName}}/tasks/install.js\x1b[0m.
     If fork flag is true. Need to be modified at \x1b[33m{{destDirName}}/app/src/sections/fork.js\x1b[0m.
  4. \x1b[34mnpm run dev\x1b[0m`
}
