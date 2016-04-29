"use strict"

const debug = require('debug')('files_ops')
const once = require('once')
const octal = require('octal')
const xtend = require('xtend')
const path = require('path')
const concat = require('concat-stream')

const errno = require('../../lib/errno')

let NOFILE = new Error('Cannot get a file from file_id')
NOFILE.code = 'NOFILE'

module.exports = function(db) {
  let ops = {}

  /**
   * cb(err, file_detail, id)
   */
  ops.get = function(id, cb) {
    db.get(id, {valueEncoding: 'json'}, (err, file_detail) => {
      if(err && err.notFound) return cb(NOFILE, null, id)
      if(err) return cb(err, null, id)
      return cb(null, file_detail, id)
    })
  }

  /**
	 * cb(err, id)
	 * if err === null -> file exists
	 */
	ops.checkNotExist = function(id, cb) {
		ops.get(id, (err, f, k) => {
      if(err && err.code === 'NOFILE') return cb(null, id)
			if(err) return cb(err, id)
			return cb(errno.EEXIST(id), id)
    })
	}

  /**
   * cb(err, id)
   */
  ops.writable = function(id, cb) {
    ops.checkNotExist(id, (err, id) => {
      if(err) return cb(err, id)
      return cb(null, id)
    })
  }

  /**
   * cb(err, id)
   */
  ops.put = function(id, data, cb) {
    ops.writable(id, (err, id) => {
      if(err) return cb(err, id)
      return db.put(id, data, {valueEncoding: 'json', sync: true}, err => {
        if(err) return cb(err, id)
        return cb(null, id)
      })
    })
  }

  ops.update = function(id, modify_data, cb) {
    ops.get(id, (err, f, id) => {
      if(err) return cb(err, id)
      return db.put(id, xtend(f, modify_data), {valueEncoding: 'json', sync: true}, err => {
        if(err) return cb(err, id)
        return cb(null, id)
      })
    })
  }

  /**
   * cb(err, id)
   */
  ops.del = function(id, cb) {
    return db.del(id, err => {
      if(err) return cb(err, id)
      return cb(null, id)
    })
  }

  return ops
}
