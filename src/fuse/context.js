"use strict"

const debug = require('debug')('fuse')
const fs = require('fs-extra')
const fuse = require('fuse-bindings')
const path = require('path')
const Promise = require('bluebird')

const lib = require('../lib/lib')

// db operations
const file_metadata_ops = require('../secure_db/operations/file_metadata_ops')
const files_ops = require('../secure_db/operations/files_ops')

// promisify
fs.openAsync = Promise.promisify(fs.open)

// global values in the scope
const FD_MAX = 65535
const ENOENT = -2

let fd_count = 0


exports.getMainContext = function(root, db, io, options) {
  if(!root || !db || !io) return null

  root = path.resolve(root)

  let fm_ops = file_metadata_ops(db.fileMetadata) // file metadata operations
  let f_ops = files_ops(db.files) // files operation

  // ops is the context of fuse
  let ops = {}

  // global values in the scope
  let fd_map = new Map()
  let fd_count = 0


  // ops.options = ['direct_io', 'dev', 'debug']
  ops.options = options.options || []

  // param: "key" === "path"

  ops.getattr = function(key, cb) {
    debug('getattr = %s', key)

    fm_ops.get(key, (err, s, k) => {
      if(err) return cb(fuse[err.code])
      debug('stat', s)
      return cb(0, s)
    })
  }


  ops.fgetattr = function(key, fd, cb) {
    debug('fgetattr = %s, fd = %s', key, fd)

    if(!fd_map.has(fd)) return ops.getattr(key, cb)
    return cb(0, fd_map.get(fd).stat)
  }

  ops.open = function(key, flag, cb) {
    debug('open = %s, flag = %s', key, flag)

    if(fd_count > FD_MAX) return cb(fuse['EMFILE'])
    fm_ops.get(key, (err, s, k) => {
      if(err) return cb(fuse[err.code])
      debug('stat', s)

      let opened_file = {
        flag: flag,
        stat: s
      }

      // genUniqueKeyFromMap need to upgrad the algorithm
      // or it will process too much time to generate the fd number
      let fd = lib.genUniqueKeyFromMap(fd_map, fd_count, FD_MAX)
      debug(`${key} -> fd =`, fd)

      fd_map.set(fd, opened_file)
      fd_count++
      return cb(0, fd)

      // // get a unique fd
      // // "./fd/fd" is a dummy file to generate a file descriptor
      // fs.openAsync('/src/src/fuse/fd', flag)
      // .then(fd => {
      //   debug(`${key} -> fd =`, fd)
      //
      //   // record the fd mapping
      //   fd_map.set(fd, opened_file)
      //   fd_count++
      //   cb(0, fd)
      // })
      // .catch(err => {
      //   console.log(err)
      //   cb(fuse['ENOMEM'])
      // })
    })
  }

  ops.read = function(key, fd, buf, len, offset, cb) {
    debug('read = %s, fd = %s, len = %s, offset = %s', key, fd, len, offset)

    // let str = 'hello world'
    // buf.write(str)
    // return cb(str.length))
  }

  ops.readdir = function(key, cb) {
    debug('readdir = %s', key)
    fm_ops.getList(key, (err, files) => {
      if(err) return cb(fuse[err.code])
      return cb(0, files.concat(['.', '..']))
    })
  }

  return ops

}
