"use strict"

const path = require('path')

exports.versionWrapper = function(v) {
  v = (v[0] === '/')? v: '/' + v
  return function(url) {
    return path.join(v, url)
  }
}

// mesure time
exports.mt = function(s_text) {
  let start = process.hrtime()
  console.log(`${s_text} - ${start}`)
  return function(e_text) {
    let diff = process.hrtime(start)
    console.log(`${e_text} transit time - ${diff}`)
    return diff[0] * 1e9 + diff[1]
  }
}

// string format for logging
exports.strF = function(...args) {
  return args.reduce((prev, cur) => {
    if(prev === '') return cur.toString()
    return prev + ', ' + cur.toString()
  }, '')
}
