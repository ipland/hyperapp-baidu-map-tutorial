const path = require('path')
const webpack = require('webpack')
const utils = require('./utils')
const env = require('./env')

exports.loadEntry = function (entries /* Object */, entryChunkName = 'src') {
  return ({
    entry:
      Object.keys(entries)
        .reduce(
          function (entry, chunkName) {
            return Object.assign(
              entry,
              {
                [chunkName]:
                  [].concat(
                    typeof entries[chunkName] === 'string' ? entries[chunkName] : entries[chunkName][entryChunkName],
                    typeof entries[chunkName] !== 'string' && env.isDev ?  [ 'core-js' ] : [],
                    env.isDev ? [ './webpack/dev-client' ] : []
                  )
              }
            )
          },
          {}
        )
  })
}

exports.loadResolver = function () {
  return ({
    resolve: {
      extensions: ['.js', '.jsx', '.json'],
      modules: [ 'src', 'node_modules' ],
      alias: { '@': path.resolve(__dirname, '..', 'src') }
    }
  })
}

// The first step towards configuring Babel to work with webpack is to set up babel-loader. It takes the code and turns it into a format older browsers can understand. Install babel-loader and include its peer dependency babel-core:
exports.loadJavaScript = function ({ include, exclude } = {}) {
  return ({
    module: {
      rules: [{
        test: /\.jsx?$/,
        include,
        exclude,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }]
    }
  })
}

exports.loadImage = function ({ limit = 8 * 1024, name = utils.assetsPath('images/[name].[hash:4].[ext]') }) {
  const svgo =  {
    plugins: [
      { cleanupAttrs: true },
      { removeDoctype: true },
      { removeXMLProcInst: true },
      { removeComments: true },
      { removeMetadata: true },
      { removeTitle: true },
      { removeDesc: true },
      { removeUselessDefs: true },
      { removeEditorsNSData: true },
      { removeEmptyAttrs: true },
      { removeHiddenElems: true },
      { removeEmptyText: true },
      { removeEmptyContainers: true },
      { removeViewBox: false },
      { cleanUpEnableBackground: true },
      { convertStyleToAttrs: true },
      { convertColors: true },
      { convertPathData: true },
      { convertTransform: true },
      { removeUnknownsAndDefaults: true },
      { removeNonInheritableGroupAttrs: true },
      { removeUselessStrokeAndFill: true },
      { removeUnusedNS: true },
      { cleanupIDs: true },
      { cleanupNumericValues: true },
      { moveElemsAttrsToGroup: true },
      { moveGroupAttrsToElems: true },
      { collapseGroups: true },
      { removeRasterImages: false },
      { mergePaths: true },
      { convertShapeToPath: true },
      { sortAttrs: true },
      { transformsWithOnePath: false },
      { removeDimensions: true },
      // { removeAttrs: { attrs: '(stroke|fill)' } },
      {
        addAttributesToSVGElement: {
          attributes: [
            { preserveAspectRatio: 'none' }
          ]
        }
      }
    ]
  }

  return ({
    module: {
      rules: [{
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        oneOf: [
          {
            resourceQuery: /external/, /* file.png?external */
            use: [
              {
                loader: 'file-loader',
                options: { name }
              },
              {
                loader: 'image-webpack-loader',
                options: { svgo }
              },
            ],
          },
          {
            /* file.png file.png? file.png?whatever */
            use: [
              {
                loader: 'url-loader',
                options: { name, limit }
              },
              {
                loader: 'image-webpack-loader',
                options: { svgo }
              },
            ],
          },
        ]
      }]
    }
  })
}

exports.loadFont = function ({ limit = 8 * 1024, name = utils.assetsPath('fonts/[name].[hash:4].[ext]') }) {
  return ({
    module: {
      rules: [{
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        use: {
          loader: 'url-loader',
          options: {
            limit,
            name
          }
        }
      }]
    }
  })
}

// webpack doesn’t know to extract CSS to a file.
//
// In the past it was a job for extract-text-webpack-plugin.
//
// Unfortunately said plugin does not play well with webpack 4.
//
// According to Michael Ciniawsky:
//
// extract-text-webpack-plugin reached a point where maintaining it become too much of a burden and it’s not the first time upgrading a major webpack version was complicated and cumbersome due to issues with it
//
// mini-css-extract-plugin is here to overcome those issues.
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
// const lessPluginFunctions = require('less-plugin-functions')

// This is the version with MiniCssExtractPlugin
exports.loadCss = function ({ include, exclude, cssModule, minimize, sourceMap, extract } = {}) {
  function styleLoader (test, loader, options) {
    return ({
      test,
      include,
      exclude,
      use: [].concat(
        extract ? MiniCssExtractPlugin.loader : 'style-loader',
        {
          loader: 'css-loader',
          options:
            Object.assign(
              {
                minimize: minimize,
                sourceMap: sourceMap,
              },
              cssModule
                ? { modules: true, localIdentName: '[local]--[hash:base64:4]' }
                : {}
            ),
        },
        'postcss-loader',
        loader
          ?
            {
              loader: `${loader}-loader`,
              options: options
            }
          : []
      )
    })
  }

  return ({
    module: {
      rules: [
        styleLoader(new RegExp(`\\.css$`), null, { plugins: [ /*new lessPluginFunctions()*/ ] }),
        styleLoader(new RegExp(`\\.less$`), 'less', { plugins: [ /*new lessPluginFunctions()*/ ] }),
      ]
    },
    plugins: [].concat(
        extract
          ?
            [
              new MiniCssExtractPlugin({
                filename: utils.assetsPath('css/[name].[contenthash:4].css'),
                chunkFilename: utils.assetsPath('css/[id].[contenthash:4].css'),
              })
            ]
          : []
      )
  })
}

// This plugin uses UglifyJS v3 (uglify-es) to minify your JavaScript
const UglifyWebpackPlugin = require('uglifyjs-webpack-plugin')
exports.minifyJavaScript = function ({ sourceMap = true } = {}) {
  return ({
    optimization: {
      minimizer: [
        new UglifyWebpackPlugin({
          parallel: true,
          cache: true,
          sourceMap: sourceMap,
          extractComments: true,
          uglifyOptions: {
            compress: {
              warnings: true,
              unused: true,
              dead_code: true,
              drop_console: true,
              drop_debugger: true,
            },
            ie8: false,
          }
        })
      ]
    }
  })
}

// Minifying CSS
// css-loader allows minifying CSS through cssnano. Minification needs to be enabled explicitly using the minimize option. You can also pass cssnano specific options to the query to customize the behavior further.
//
// clean-css-loader allows you to use a popular CSS minifier clean-css.
//
// optimize-css-assets-webpack-plugin is a plugin based option that applies a chosen minifier on CSS assets. Using ExtractTextPlugin can lead to duplicated CSS given it only merges text chunks. OptimizeCSSAssetsPlugin avoids this problem by operating on the generated result and thus can lead to a better result.
exports.minifyCss = function ({ options } = {}) {
  const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin')
  const cssnano = require('cssnano')

  return ({
    plugins: [
      new OptimizeCssAssetsPlugin({
        cssProcessor: cssnano,
        cssProcessorOptions: options,
        canPrint: false
      })
    ]
  })
}

const HtmlWebpackPlugin = require('html-webpack-plugin')
exports.loadHtml = function (entries /* Object */, entryChunkName = 'src') {
  var productionOption = {
    hash: false,
    inject: true,
    minify: {
      removeComments: true,
      collapseWhitespace: true,
      removeAttributeQuotes: true,
      // more options:
      // https://github.com/kangax/html-minifier#options-quick-reference
      minifyJS: true,
      minifyCSS: true
    },
    // necessary to consistently work with multiple chunks via CommonsChunkPlugin
    // chunksSortMode: 'dependency'
  }

  return ({
    plugins:
      Object.keys(entries)
        .filter(chunkName => typeof entries[chunkName] !== 'string')
        .map(
          function (chunkName) {
            return new HtmlWebpackPlugin(
              Object.assign(
                {
                  injectHeadChunks: entries[chunkName].injectHeadChunks,
                  chunks: [ chunkName ],
                  template: 'index.html'
                },
                utils.omit(entries[chunkName], entryChunkName),
                entries[chunkName][process.env.NODE_ENV] || {},
                env.isProd ? productionOption : {}
              )
            )
          }
        )
  })
}

// Best approach to pass Environment Variables
exports.setEnvVariables = function (obj) {
  return {
    plugins: [ new webpack.DefinePlugin(obj) ]
  }
}

exports.optimizeSplitChunks = function () {
  return {
    optimization: {
      splitChunks: {
        cacheGroups: {
          'core-js': {
            test: /[\\/]node_modules[\\/](core-js)[\\/]/,
            name: 'core-js',
            chunks: 'initial',
            enforce: true, /* always create chunks for this cache group. */
          },
        }
      }
    }
  }
}

// Use the NoEmitOnErrorsPlugin to skip the emitting phase whenever there are errors while compiling. This ensures that no assets are emitted that include errors. The emitted flag in the stats is false for all assets.
exports.setNoErrors = function () {
  return ({
    plugins: [ new webpack.NoEmitOnErrorsPlugin() ]
  })
}

// Prepare compressed versions of assets to serve them with Content-Encoding
exports.setCompression = function () {
  const CompressionPlugin = require('compression-webpack-plugin')

  return ({
    plugins: [ new CompressionPlugin(), ]
  })
}

// This module will help you:
//
// Realize what's really inside your bundle
// Find out what modules make up the most of its size
// Find modules that got there by mistake
// Optimize it!
// And the best thing is it supports minified bundles! It parses them to get real size of bundled modules. And it also shows their gzipped sizes!
exports.setAnalyzer = function () {
  const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin

  return ({
    plugins: [ new BundleAnalyzerPlugin() ]
  })
}
