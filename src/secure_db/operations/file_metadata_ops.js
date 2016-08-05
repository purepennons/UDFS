"use strict"

const debug = require('debug')('file_metadata_ops')
const once = require('once')
const octal = require('octal')
const xtend = require('xtend')
const path = require('path')
const concat = require('concat-stream')
const Promise = require('bluebird')

const n = require('../../lib/path')
const stat = require('../../lib/stat')
const lib = require('../../lib/lib')
const errno = require('../../lib/errno')

const ROOT = lib.metaWrapper(stat({
	type: 'directory',
	mode: octal(40755),
	size: 4096,
  uid: process.getuid(),
  gid: process.getgid()
}))

module.exports = function(db) {
  let ops = {}

  /**
   * cb(err, file, key)
   */
  ops.get = function(key, cb) {
    key = n.normalize(key)

    if(key === '/') return process.nextTick( cb.bind(null, null, ROOT, '/') )
    db.get(n.prefix(key), {valueEncoding: 'json'}, (err, file) => {
      if(err && err.notFound) return cb(errno.ENOENT(key), null, key)
      if(err) return cb(err, null, key)
      return cb(null, file, key)
    })
  }

	/**
	 * cb(err, stat, key)
	 */
	ops.getStat = function(key, cb) {
		ops.get(key, (err, file, key) => {
			if(!file.stat) return cb(errno.ENOENT(key), null, key)
			return cb(null, file.stat, key)
		})
	}

  /**
   * cb(err, files)
   */
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
	 * cb(err, stats)
	 */
	ops.getStatList = function(key, cb) {
		ops.getList(key, (err, files) => {
			if(err) return cb(err, null)
			return cb(null, files.map(file => file.stat))
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
   * cb(err, key)
   */
  ops.writable = function(key, cb) {
    key = n.normalize(key)

    if(key === '/') return process.nextTick( cb.bind(null, errno.EPERM(key)) )

		// check the file exist or not
		ops.checkNotExist(key, err => {
			if(err) return cb(err, key)

			// check the parent folder is exist or not.
			ops.checkParents(path.dirname(key), (err, file, k) => {
				if(err) return cb(err)
				if(!stat(file.stat).isDirectory()) return cb(errno.ENOTDIR(key))
				return cb(null, key)
			})
		})
  }

	/**
	 * cb(err, key)
	 * if err === null -> file exists
	 */
	ops.checkNotExist = function(key, cb) {
		ops.get(key, (err, file, k) => {
      if(err && err.code === 'ENOENT') return cb(null, key)
			if(err) return cb(err, key)
			return cb(errno.EEXIST(key), key)
    })
	}

  /**
   * cb(err, file, key)
   */
  ops.checkParents = function(dir, cb) {

    let parent_file = null

    dir = n.normalize(dir)
    if(dir === '/') return process.nextTick( cb.bind(null, null, ROOT, '/') )

    function loop(pdir) {
      ops.get(pdir, (err, file, key) => {
        if(err) return cb(err, file, key)
        if(pdir === dir) parent_file = file
        if(pdir !== '/') {
          return loop(path.dirname(pdir))
        } else {
          return cb(null, parent_file, key)
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
      return db.put(n.prefix(key), data, {valueEncoding: 'json', sync: true}, err => {
        if(err) return cb(err, key)
        return cb(null, key)
      })
    })
  }

	/**
	 * cb(err, key)
	 */
	ops.update = function(key, modify_data, cb) {
		ops.get(key, (err, file, key) => {
			if(err) return cb(err, key)
			if(key === '/') return cb(errno.EPERM(key), key)

			// updates all properties
			// file will be the data to be updated
			Object.keys(modify_data).map(prop => {
				debug('prop', prop)
				file[prop] = xtend(file[prop], modify_data[prop])
			})

			return db.put(n.prefix(key), file, {valueEncoding: 'json', sync: true}, err => {
				if(err) return cb(err, key)
        return cb(null, key)
			})
		})
	}

	/**
	 * cb(err, key)
	 */
  ops.del = function(key, cb) {
		key = n.normalize(key)

		if(key === '/') return process.nextTick( cb.bind(null, errno.EPERM(key)) )

		return db.del(n.prefix(key), err => {
			if(err) return cb(err, key)
			return cb(null, key)
		})
  }

	// promisify
	ops = Promise.promisifyAll(ops)

  return ops
}
