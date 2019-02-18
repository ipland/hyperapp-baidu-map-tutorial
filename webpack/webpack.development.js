const webpack = require('webpack')
const merge = require('webpack-merge')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const commonWebpackConfig = require('./webpack.common')
const parts = require('./webpack.parts')
const config = require('../config')
const utils = require('./utils')
const env = require('./env')

module.exports = merge([
  commonWebpackConfig,
  {
    // bail - boolean
    // Fail out on the first error instead of tolerating it.
    // By default webpack will log these errors in red in the terminal,
    // as well as the browser console when using HMR, but continue bundling.
    bail: true,
    devtool: 'cheap-module-eval-source-map',
    mode: 'development',
    output: {
      path: config.build.assetsRoot,
      filename: utils.assetsPath('js/[name].js'),
      chunkFilename: utils.assetsPath('js/bundle.[name].js'),
      publicPath: config.dev.assetsPublicPath
    },
  },
  parts.setNoErrors(),
  parts.setEnvVariables({
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      SERVER_ENV: JSON.stringify(process.env.SERVER_ENV),
    }
  }),
  {
    plugins: [
      new webpack.NamedModulesPlugin(),
      // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
      new webpack.HotModuleReplacementPlugin(),
      new webpack.NoEmitOnErrorsPlugin(),
      // https://github.com/ampedandwired/html-webpack-plugin
      new FriendlyErrorsPlugin()
    ]
  }
])
