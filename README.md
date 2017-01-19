## Overview

> 一个基于 webpack 的 electron 代码模板

* 包含编译 native addons 例子
 * 编译采用 tasks/install.js 中执行 bash shell 方式解决, --build-from-source 参数的添加是为了解决 amazonaws 被墙从而导致 node 文件无法下载, npm 超时问题.
* 包含打包 native addons 例子
 * webpack 的 node-loader 模块, 在代码中将 node 文件识别为绝对路径, 无法将含有 native addons 的工程正确打包为可执行程序. 本例将 app/node_modules 也打包进 app.asar 中, 并将 require 代码写在 index.ejs 中 head 代码块中以此来解决打包问题.
* 包含使用 fork 函数的例子
 * webpack 不识别 fork 函数, 进而无法对 fork 的文件进行打包, 本例采用多目标打包配置, 解决 fork 文件打包问题.
* 两种调试模式
 * developmentHot 模式适合前期阶段, 支持热更新, 快速开发
 * developmentPack 模式适合打包前测试阶段, 模拟打包之前的程序结构, 更快定位打包后可能出现的问题


## Installation

 * node
 * npm
 * vue-cli
  * npm i vue-cli -g


## Build Setup

``` bash
# init project
vue init llwslc/electron-webpack my-project

# install dependencies
cd my-project
npm i

# run your app
npm run dev
```
