'use strict'

const electron = require('electron');
const path = require('path');
const app = electron.app;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

let mainWindow;
let config = {};

if (!!process.env.NODE_ENV)
{
}
else
{
  process.env.NODE_ENV = 'production';
}

if (process.env.NODE_ENV === 'developmentHot')
{
  config = require('../config');
  config.url = `http://localhost:${config.port}`;
}
else
{
  config.devtron = false;
  config.url = `file://${__dirname}/dist/index.html`;
}

function createWindow ()
{
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    minHeight: 600,
    minWidth: 800
  });

  mainWindow.maximize();

  if (process.env.NODE_ENV.indexOf('development') !== -1)
  {
    BrowserWindow.addDevToolsExtension(path.join(__dirname, '../node_modules/devtron'));
    BrowserWindow.addDevToolsExtension(path.join(__dirname, '../node_modules/vue-devtools'));

    mainWindow.webContents.openDevTools();
  }

  if (process.env.NODE_ENV === 'production')
  {
{{#if update}}
    const UpdateObj = require('./update');
    let update = new UpdateObj();
    update.setFeedURL('http://localhost');
    update.checkLocalUpdates();
{{/if}}
    if (process.argv[1] === 'debug')
    {
      process.env.DEBUG = true;
    }
  }

  mainWindow.loadURL(config.url);

  mainWindow.on('closed', function ()
  {
    mainWindow = null;
  })

  console.log('mainWindow opened');
}

app.on('ready', createWindow);

app.on('window-all-closed', function ()
{
  app.quit();
});

app.on('activate', function ()
{
  if (mainWindow === null)
  {
    createWindow();
  }
});
