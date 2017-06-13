# {{ name }}

> {{ description }}

## Installation

 * node
 * npm
{{#if rebuild}}
 * node-gyp
  * npm i node-gyp -g
{{/if}}

## Build Setup

``` bash
# install dependencies
npm install

# serve with hot reload at localhost:8080
npm run dev

# run packed project for development
npm run pack

# build electron app for production
npm run package

# just run webpack for production
npm run pack:just

# just run electron packager for production
npm run package:just

# just run inno setup for production
npm run installer:just
```
