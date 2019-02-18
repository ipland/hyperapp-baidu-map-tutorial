const merge = require('webpack-merge')
const parts = require('./webpack.parts')
const entries = require('./entries')
const utils = require('./utils')
const env = require('./env')

module.exports = merge([
  parts.loadEntry(entries, 'src'),
  parts.loadHtml(entries, 'src'),
  parts.loadResolver(),
  parts.loadJavaScript({ exclude: /node_modules/ }),
  parts.loadCss({ cssModule: false, minimize: env.isProd, sourceMap: env.isProd, extract: env.isProd }),
  parts.loadImage({ limit: env.isProd ? 8 * 1024 : 1, name: utils.assetsPath('images/[name].[hash:4].[ext]') }),
  parts.loadFont({  limit: env.isProd ? 8 * 1024 : 1, name: utils.assetsPath('fonts/[name].[hash:4].[ext]') }),
])
