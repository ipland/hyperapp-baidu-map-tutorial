const merge = require('webpack-merge')
const commonWebpackConfig = require('./webpack.common')
const parts = require('./webpack.parts')
const utils = require('./utils')
const config = require('../config')

module.exports = merge([
  commonWebpackConfig,
  {
    bail: false,
    devtool: 'source-map',
    mode: 'production',
    output: {
      path: config.build.assetsRoot,
      filename: utils.assetsPath('js/[name].[chunkhash:4].js'),
      chunkFilename: utils.assetsPath('js/bundle.[name].[chunkhash:4].js'),
      publicPath: config.build.assetsPublicPath,
    },
  },
  parts.minifyJavaScript(),
  parts.minifyCss(),
  parts.setEnvVariables({
    'process.env': {
      NODE_ENV: JSON.stringify('production'),
      SERVER_ENV: JSON.stringify(process.env.SERVER_ENV), /* development | testing | production */
    }
  }),
  parts.optimizeSplitChunks(),
])
