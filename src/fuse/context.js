"use strict"

const debug = require('debug')('fuse')
const fs = require('fs-extra')
const fuse = require('fuse-bindings')
const path = require('path')
const octal = require('octal')
const xtend = require('xtend')
const constants = require('constants')  // node constants
const Promise = require('bluebird')

const lib = require('../lib/lib')

// db operations
const file_metadata_ops = require('../secure_db/operations/file_metadata_ops')
const files_ops = require('../secure_db/operations/files_ops')

// promisify
fs.openAsync = Promise.promisify(fs.open)

// global values in the scope
const FD_MAX = 65535
const BLOCK_SIZE = 4096
const DIRECTORY_SIZE = BLOCK_SIZE
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

    // this is the faster way, but the stat may be not sync.
    // if(!fd_map.has(fd)) return ops.getattr(key, cb)
    // return cb(0, fd_map.get(fd).stat)

    return ops.getattr(key, cb)
  }

  ops.open = function(key, flag, cb) {
    debug('open = %s, flag = %s', key, flag)

    if(fd_count > FD_MAX) return cb(fuse['EMFILE'])
    fm_ops.get(key, (err, s, k) => {
      if(err) return cb(fuse[err.code])
      debug('stat', s)

      let opened_file = {
        path: key,
        flag: flag, // -1 mean it is called from ops.create
        file_id: s.file_id,
        stat: s // maybe not sync, if it is accessed parallel
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

  ops.release = function(key, fd, cb) {
    debug('release %s, fd = %s', key, fd)

    function clearup() {
      fd_map.delete(fd)
      fd_count--
      return
    }

    if(fd) clearup()
    return cb(0)
  }

  ops.read = function(key, fd, buf, len, offset, cb) {
    debug('read from %s, fd = %s, buffer_len = %s, len = %s, offset = %s', key, fd, buf.length, len, offset)

    let f = fd_map.get(fd)
    let s = f.stat

    if(!f) return cb(fuse['ENOENT'])

    // if(len > s.size - offset) len = s.size - offset
    // 當欲讀取剩餘大小 (s.size-offset) 小於 buffer 長度，設定 buffer 長度 = 讀取剩餘大小 (s.size-offset)
    if(s.size - offset < len) {
      f.hasNext = false
      len = s.size - offset
    }


    debug('f.offset = %s, offset = %s', f.offset, offset)

    if(!f.stream) {
      // TODO:
      // change to the real io request
      f.stream = fs.createReadStream('/src/src/fuse/fake_data/test', {
        start: offset
      })

      // if change to other stream source, maybe need to set the encording to null(binary).
      // f.stream.setEncoding(null)

      f.stream.on('error', err => {
        debug('[ERROR]-read', err.stack)
        return cb(fuse['EIO'])
      })

      f.offset = offset
      fd_map.set(fd, f)
    }

    // end condition
    if(f.stream && f.offset !== offset) {
      // destory the stream
      f.stream.destroy()
      f.stream = null

      fd_map.set(fd, f)
    }

    // read the file by stream
    // Max read size of each time is equal to the length of buffer
    function loop() {
      // if the stream was cleared, end the reading operation
      if(!f.stream) return cb(0)

      let result = f.stream.read(len)
      if(!result) return f.stream.once('readable', loop)
      result.copy(buf)

      debug('result length = %s', result.length)
      return cb(result.length)
    }

    loop()
  }

  ops.readdir = function(key, cb) {
    debug('readdir = %s', key)
    fm_ops.getList(key, (err, files) => {
      if(err) return cb(fuse[err.code])
      return cb(0, files.concat(['.', '..']))
    })
  }

  ops.mkdir = function(key, mode, cb) {
    debug('mkdir %s, mode = %s', key, mode)

    let s = {
      mode: mode + octal(40000),  // octal(40000) means that the file is a directory
      size: DIRECTORY_SIZE,
      type: 'directory'
    }

    fm_ops.put(key, lib.statWrapper(s, true), (err, k) => {
      if(err) return cb(fuse[err.code])
      return cb(0)
    })
  }

  ops.create = function(key, mode, cb) {
    debug('create %s, mode = %s', key, mode)

    // maybe need to handle 'w+' mode which must truncate the size to zero first if the file already exists.
    // ignore now
    let s = {
      mode: mode,
      size: 0,
      type: 'file'
    }

    /**
     * TODO: write detail of metadata to secure db
     *
     */
    fm_ops.put(key, lib.statWrapper(s), (err, k) => {
      if(err) return cb(fuse[err.code])
      ops.open(key, -1, cb)
    })
  }

  ops.write = function(key, fd, buf, len, offset, cb) {
    // maybe need to set status of file to true
    // first time to write, create the detail fo the file (if detial of the file not exists)

    debug('write to %s, fd = %s, buffer_len = %s, len = %s, offset = %s', key, fd, buf.length, len, offset)
    // debug('buffer', buf.toString())
    return cb(len)
  }

  ops.truncate = function(key, size, cb) {
    debug('truncate %s, size = %s', key, size)
    cb(0)
  }

  return ops

}
