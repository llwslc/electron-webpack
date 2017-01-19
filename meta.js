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
    'app/src/sections/forkJs.js': 'fork',
  },
  completeMessage: `---

All set. More configurations can be made at \x1b[33m{{destDirName}}/config.js\x1b[0m.

Next steps:
  1.
     \x1B[32mcd {{destDirName}}\x1b[0m
  2.
     \x1B[32mnpm i\x1b[0m
{{#if rebuild}}
  3.
{{else}}
{{#if fork}}
  3.
{{/if}}
{{/if}}
{{#if rebuild}}
     The \x1B[1mrebuild\x1b[0m flag is true. Need to be modified at \x1b[33m{{destDirName}}/tasks/install.js\x1b[0m.
{{/if}}
{{#if fork}}
     The \x1B[1mfork\x1b[0m flag is true. Need to be modified at \x1b[33m{{destDirName}}/app/src/sections/forkJs.js\x1b[0m.
{{/if}}
{{#if rebuild}}
  4.
{{else}}
{{#if fork}}
  4.
{{else}}
  3.
{{/if}}
{{/if}}
     \x1B[32mnpm run dev\x1b[0m`
}
