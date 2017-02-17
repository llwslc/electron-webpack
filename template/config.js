'use strict'

const path = require('path')

let config = {
  // Name of electron app
  // Will be used in production builds
  name: '{{ name }}',

  // webpack-dev-server port
  port: 8080,

  // electron-packager options
  building: {
    arch: 'x64',
    asar: true,
    dir: path.join(__dirname, 'app'),
    icon: path.join(__dirname, 'app/icons/icon'),
    ignore: /^\/(icons|shell|src|index\.ejs)/,
    prune: false,
    overwrite: true,
    win32metadata: {
{{#if companyname}}
      CompanyName: '{{ companyname }}',
{{/if}}
      FileDescription: '{{ name }}',
    },
    platform: require('os').platform(),
    out: path.join(__dirname, 'packages'),
  }
}

config.building.name = config.name

module.exports = config
