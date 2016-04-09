/**
 * Reference from [mafintosh/level-filesystem](https://github.com/mafintosh/level-filesystem/blob/master/paths.js)
 */

"use strict"

const path = require('path')

exports.normalize = function(key) {
  key = key[0] === '/' ? key : '/' + key
	key = path.normalize(key)
	if (key === '/') return key
	return key[key.length-1] === '/' ? key.slice(0, -1) : key
}

exports.prefix = function(key) {
  let depth = key.split('/').length.toString(36)
	return '0000000000'.slice(depth.length) + depth + key
}
