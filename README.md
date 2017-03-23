## Overview

> 一个基于 webpack 的 electron 代码模板

* 包含支持 vue 框架示例
  * 使用 webpack 打包 vue 框架文件.
* 包含编译 native addons 示例
  * 编译采用 tasks/install.js 中执行命令行方式解决, --build-from-source 参数的添加是为了解决 amazonaws 被墙从而导致 node 文件无法下载, npm 超时问题.
* 包含打包 native addons 示例
  * webpack 的 node-loader 模块, 在代码中将 node 文件识别为绝对路径, 无法将含有 native addons 的工程正确打包为可执行程序. 本例将 app/node_modules 也打包进 app.asar 中, 并将 require 代码写在 index.ejs 中 head 代码块中以此来解决打包问题.
* 包含使用 fork 函数的示例
  * webpack 不识别 fork 函数, 进而无法对 fork 的文件进行打包, 本例采用多目标打包配置, 解决 fork 文件打包问题.
* 包含一个多国语模块
  * 在 app/src/locale/lang 目录下可以添加任意语言对应翻译, vue 文件中包含示例.
* 包含多平台文件打包示例
  * win
    * 打包生成程序为 msi 安装文件.
      * 依赖 [microsoft visual studio 2015 installer projects](https://marketplace.visualstudio.com/items?itemName=VisualStudioProductTeam.MicrosoftVisualStudio2015InstallerProjects).
    * 打包生成程序为 zip 升级文件.
      * 依赖 windows powerShell 5.0 及以上.
  * mac
    * 打包生成程序为 dmg 安装文件.
    * 打包生成程序为 zip 升级文件.
* 包含多平台程序升级示例
  * electron 自带 autoUpdater 采用 Squirrel 框架, 不太友好, 故重构了一个较为简单的升级模块.
  * win
    * 编译生成一个 update.exe 随主程序一起发布, 主程序请求升级并下载升级压缩包, 退出后执行 update.exe 程序覆盖原程序, 完成升级过程.
  * mac
    * 主程序请求升级并下载解压升级程序, 将解压文件通过 bash shell 直接覆盖原程序, 完成升级过程.
* 包含两种调试模式
  * developmentHot 模式适合前期阶段, 支持热更新, 快速开发.
  * developmentPack 模式适合打包前测试阶段, 模拟打包之前的程序结构, 更快定位打包后可能出现的问题.

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
