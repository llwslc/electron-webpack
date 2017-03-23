'use strict'

const path = require('path')
const settings = require('./config.js')
const webpack = require('webpack')

const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')

let indexConfig = {
  target: 'electron-renderer',
  devtool: '#eval-source-map',
  entry: {
    build: path.join(__dirname, './app/src/main.js')
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          loaders: {
            'scss': 'vue-style-loader!css-loader!sass-loader',
            'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax'
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-0'],
          plugins: ['transform-runtime']
        }
      },
      {
        test: /\.json$/,
        loader: 'json-loader'
      },
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader"
        })
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: 'imgs/[name].[hash:7].[ext]'
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: 'fonts/[name].[hash:7].[ext]'
        }
      }
    ]
  },
  plugins: [
    new ExtractTextPlugin('styles.css'),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: './app/index.ejs',
      title: settings.name
    }),
    new webpack.ProvidePlugin({
    }),
    new webpack.NoEmitOnErrorsPlugin()
  ],
  node: {
    __dirname: true
  },
  resolve: {
    extensions: ['.js', '.vue'],
    modules: [path.resolve(__dirname, "app"), "node_modules"]
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './app/dist')
  }
}


let configArr = []
configArr.push(indexConfig)

{{#if fork}}
let forkConfig = {
  target: 'electron',
  devtool: '#eval-source-map',
  entry: {
    fork: path.join(__dirname, './app/src/sections/forkJs.js')
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ['es2015', 'stage-0'],
          plugins: ['transform-runtime']
        }
      }
    ]
  },
  node: {
    __dirname: true
  },
  resolve: {
    extensions: ['.js'],
    modules: [path.resolve(__dirname, "app"), "node_modules"]
  },
  output: {
    filename: '[name].js',
    path: path.join(__dirname, './app/dist')
  }
}

if (process.env.NODE_ENV === 'production') {
  forkConfig.devtool = ''
}

if (process.env.NODE_ENV !== 'developmentHot') {
  configArr.push(forkConfig)
}
{{/if}}


if (process.env.NODE_ENV === 'production') {
  indexConfig.devtool = ''

  indexConfig.plugins.push(
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': '"production"'
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  )
}


module.exports = configArr
