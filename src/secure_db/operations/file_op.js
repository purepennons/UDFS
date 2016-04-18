"use strict"

const debug = require('debug')('file_op')
const once = require('once')
const octal = require('octal')
const path = require('path')
const concat = require('concat-stream')

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

    if(key === '/') return process.nextTick( cb.bind(null, null, ROOT, '/') )
    db.get(n.prefix(key), {valueEncoding: 'json'}, (err, file) => {
      if(err && err.notFound) return cb(errno.ENOENT(key), null, key)
      if(err) return cb(err, null, key)
      return cb(null, stat(file), key)
    })
  }

  ops.getDetail = function() {

  }

  ops.getList = function(key, cb) {
    cb = once(cb)

    key = n.normalize(key)

    let start = n.prefix(key === '/' ? key : key + '/')
    let keys = db.createKeyStream({
      gt: start,
      lt: start + '\xff'
    })

    keys
    .pipe(concat({encoding:'object'}, files => {
      files = files.map(file => file.split('/').pop())
      cb(null, files)
    }))
    .on('error', cb)
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
   * cb(err, key)
   */
  ops.writable = function(key, cb) {
    key = n.normalize(key)

    if(key === '/') return process.nextTick( cb.bind(null, errno.EPERM(key)) )

    // check the parent folder is exist or not.
    ops.checkParents(path.dirname(key), (err, s, k) => {
      if(err) return cb(err)
      if(!s.isDirectory()) return cb(errno.ENOTDIR(key))
      cb(null, key)
    })
  }

  /**
   * cb(err, stat, key)
   */
  ops.checkParents = function(dir, cb) {

    let parent_state = null

    dir = n.normalize(dir)
    if(dir === '/') return process.nextTick( cb.bind(null, null, ROOT, '/') )

    function loop(pdir) {
      ops.get(pdir, (err, s, key) => {
        if(err) return cb(err, s, key)
        if(pdir === dir) parent_state = s
        if(pdir !== '/') {
          return loop(path.dirname(pdir))
        } else {
          return cb(null, parent_state, key)
        }
      })
    }

    loop(dir)
  }

  /**
   * cb(err, key)
   */
  ops.put = function(key, data, cb) {
    ops.writable(key, err => {
      if(err) return cb(err, key)
      return db.put(n.prefix(key), data, {valueEncoding: 'json'}, err => {
        if(err) return cb(err, key)
        return cb(null, key)
      })
    })
  }

  ops.del = function(key, cb) {

  }

  return ops
}
