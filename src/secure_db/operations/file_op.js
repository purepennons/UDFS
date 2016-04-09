"use strict"

const once = require('once')
const octal = require('octal')

const n = require('../../lib/path')
const stat = require('../../lib/stat')
const errno = require('../../lib/errno')

const ROOT = stat({
	type: 'directory',
	mode: octal(777),
	size: 4096
})

module.exports = function(db) {
  let ops = {}

  /**
   * cb(err, stat, key)
   */
  ops.get = function(key, cb) {
    key = n.normalize(key)

    // if(key === '/') return process.nextTick(cb.bind(null, null, ROOT, '/'))
    db.get(n.prefix(key), {valueEncoding:'json'}, (err, file) => {
      if(err && err.notFound) return cb(errno.ENOENT(key), null, key)
      if(err) return cb(err, null, key)
      return cb(null, stat(file), key)
    })
  }

  ops.getDetail = function() {

  }

  ops.getList = function() {

  }

  ops.put = function(key, data) {
  }

  return ops
}
