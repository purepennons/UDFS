"use strict"

const path = require('path')

exports.versionWrapper = function(v) {
  v = (v[0] === '/')? v: '/' + v
  return function(url) {
    return path.join(v, url)
  }
}
