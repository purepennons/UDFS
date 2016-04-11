"use strict"

const debug = require('debug')('file_op')
const once = require('once')
const octal = require('octal')
const path = require('path')

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

    if(key === '/') return process.nextTick(cb.bind(null, null, ROOT, '/'))
    db.get(n.prefix(key), {valueEncoding: 'json'}, (err, file) => {
      if(err && err.notFound) return cb(errno.ENOENT(key), null, key)
      if(err) return cb(err, null, key)
      return cb(null, stat(file), key)
    })
  }

  ops.getDetail = function() {

  }

  ops.getList = function() {

  }

  /**
   * cb(err, key)
   */
  ops.writable = function(key, cb) {
    key = n.normalize(key)

    if(key === '/') return process.nextTick( cb.bind(null, errno.EPERM(key)) )

    // check the parent folder is exist or not.
    ops.checkParents(key, (err, s, k) => {
      if(err) return cb(err)
      if(!s.isDirectory()) return cb(errno.ENOTDIR(key))
      cb(null, key)
    })
  }

  /**
   * cb(child_dir)
   */
  ops.travelDir = function(dir, cb) {
    if(dir === '/') return cb(dir)
    cb(dir)
    return this.travelDir( path.dirname(dir), cb )
  }

  /**
   * cb(err, stat, key)
   */
  ops.checkParents = function(dir, cb) {
    dir = n.normalize(dir)

    function loop(pdir) {
      ops.get(pdir, (err, s, key) => {
        if(err) return cb(err, s, key)
        if(pdir.length) return cb(null, s, key)
        if(pdir !== '/') return loop(path.dirname(pdir))
      })
    }

    loop()
  }

  ops.put = function(key, data, cb) {
    ops.writable(key, err => {
      if(err) return cb(err)
      return db.put(n.prefix(key), data, {valueEncoding: 'json'}, err => {
        cb(err, key)
      })
    })
  }

  ops.del = function(key, cb) {

  }

  return ops
}
