const path = require('path')
const env = require('./env')
const config = require('../config')

exports.assetsPath = function (_path) {
  const assetsSubDirectory = env.isProd
    ? config.build.assetsSubDirectory
    : config.dev.assetsSubDirectory
  return path.posix.join(assetsSubDirectory, _path)
}

exports.omit = function (source, props) {
  if (typeof props === 'string') {
    props = [ props ]
  }

  return props.reduce(
    function (source, prop) { return delete source[prop] && source },
    Object.assign({}, source)
  )
}
