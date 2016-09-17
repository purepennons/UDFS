"use strict"

const debug = require('debug')('storage_metadata_ops')
const xtend = require('xtend')
const once = require('once')
const concat = require('concat-stream')
const Promise = require('bluebird')


let NOTFOUND = new Error('Cannot get a object by key')
NOTFOUND.code = 'NOTFOUND'

let EEXIST = new Error('Object exists')
EEXIST.code = 'EEXIST'

module.exports = function(db) {
  let ops = {}

  /**
   * cb(err, file_detail, key)
   */
  ops.get = function(key, cb) {
    db.get(key, {valueEncoding: 'json'}, (err, obj) => {
      if(err && err.notFound) return cb(NOTFOUND, null, key)
      if(err) return cb(err, null, key)
      return cb(null, obj, key)
    })
  }

  /*
   * @param {object} ops - gt, lt, limit
   * cb(err, data)
   * 		- data: {
   * 				key,
   * 				value
   * 			}
   */
  ops.getList = function(ops, cb) {
    ops = ops || {}
    ops.valueEncoding = 'json'

    cb = once(cb)
    
    db.createReadStream(ops)
    .pipe(concat({encoding:'object'}, data => {
      cb(null, data)
    }))
    .on('error', cb)
  }

  /**
	 * cb(err, key)
	 * if err === null -> file exists
	 */
	ops.checkNotExist = function(key, cb) {
		ops.get(key, (err, f, k) => {
      if(err && err.code === 'NOTFOUND') return cb(null, key)
			if(err) return cb(err, key)
			return cb(EEXIST, key)
    })
	}

  /**
   * cb(err, key)
   */
  ops.writable = function(key, cb) {
    ops.checkNotExist(key, (err, key) => {
      if(err) return cb(err, key)
      return cb(null, key)
    })
  }

  /**
   * cb(err, key)
   */
  ops.put = function(key, data, cb) {
    ops.writable(key, (err, key) => {
      if(err) return cb(err, key)
      return db.put(key, data, {valueEncoding: 'json', sync: true}, err => {
        if(err) return cb(err, key)
        return cb(null, key)
      })
    })
  }

  ops.update = function(key, modify_data, cb) {
    ops.get(key, (err, obj, key) => {
			if(err) return cb(err, key)

			// updates all properties
			// obj will be the data to be updated
			Object.keys(modify_data).map(prop => {
				debug('prop', prop)
				obj[prop] = xtend(obj[prop], modify_data[prop])
			})

			return db.put(key, obj, {valueEncoding: 'json', sync: true}, err => {
				if(err) return cb(err, key)
        return cb(null, key)
			})
		})
  }

  /**
   * cb(err, key)
   */
  ops.del = function(key, cb) {
    return db.del(key, err => {
      if(err) return cb(err, key)
      return cb(null, key)
    })
  }

  // promisify
	ops = Promise.promisifyAll(ops)

  return ops
}
