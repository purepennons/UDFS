"use strict"

const debug = require('debug')('fuse')
const fs = require('fs-extra')
const fuse = require('fuse-bindings')
const path = require('path')
const octal = require('octal')
const xtend = require('xtend')
const http = require('http')
const constants = require('constants')  // node constants
const Promise = require('bluebird')
const req = require('request')
const Buffer = require('buffer').Buffer

const lib = require('../lib/lib')

// db operations
const file_metadata_ops = require('../secure_db/operations/file_metadata_ops')
const files_ops = require('../secure_db/operations/files_ops')

// promisify
fs.openAsync = Promise.promisify(fs.open)
const P_req = function(ops) {
  return new Promise((resolve, reject) => {
    http.request(ops, res => {
      return resolve(res)
    }).on('error', err => {
      reject(err)
    }).end()
  })
}

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

    fm_ops.getStat(key, (err, s, k) => {
      debug('getStat', err)
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

    // async function open_gen() {
    //   let stat = await fm_ops.getStatAsync(key)
    //   let fileInfo = await
    // }
    //
    // open_gen()
    // .catch(err => cb(fuse[err.code]))


    fm_ops.getStat(key, (err, s, k) => {
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

    })
  }

  // need to release streams of read and write operations
  ops.release = function(key, fd, cb) {
    debug('release %s, fd = %s', key, fd)

    function clearup() {
      let f = fd_map.get(fd)
      if(f) {
        debug('release')
        if(f.buf) {
          // upload the read stream
          // real request
          let req_stream = req.put({
            url: `http://localhost:3000/storage/v1/70642310-3134-11e6-9e2f-3ffeaedf456b/files/e60aa7c4-732e-406f-8697-f0311803f237`,
            encoding: null,
            headers: {
              'range': 'bytes=0-',
            },
            formData: {
              'file': Buffer.concat(f.buf)
            }
          })

          req_stream
          .on('response', res => {
            fd_map.delete(fd)
            debug('res', res)
          })
          .on('error', err => {
            debug('response error', err.stack)
          })
        }
      }

      fd_map.delete(fd)
      fd_count--
      return cb(0)
    }

    if(fd) {
      clearup()
    } else {
      return cb(0)
    }
  }

  ops.read = function(key, fd, buf, len, offset, cb) {
    debug('read from %s, fd = %s, buffer_len = %s, len = %s, offset = %s', key, fd, buf.length, len, offset)

    let f = fd_map.get(fd)
    if(!f) return cb(fuse['ENOENT'])
    let s = f.stat


    // if(len > s.size - offset) len = s.size - offset
    // 當欲讀取剩餘大小 (s.size-offset) 小於 buffer 長度，設定 buffer 長度 = 讀取剩餘大小 (s.size-offset)
    if(s.size - offset < len) {
      len = s.size - offset
    }

    /**
     * 終止條件尚未完善
     * 目前：下個 offset (next_offset) 等於下次 fuse request 的 offset 時 (意味連續的 request)，
     * 沿用之前的 Stream。
     * 若 f.stream 存在，next_offset 卻不等於 offset，則銷毀 Stream，重新建立
     */
    async function gen(f) {
      // end condition
      console.log(f)
      if(f.stream && f.next_offset !== offset) {
        // destory the stream
        f.stream.destroy()
        f.stream = null

        fd_map.set(fd, f)
      }

      if(!f.stream) {
        await initStream()
      }

      loop()

      async function initStream() {
        // let ops = {
        //   hostname: 'localhost',
        //   port: 3000,
        //   path: `/storage/v1/70642310-3134-11e6-9e2f-3ffeaedf456b/files/e60aa7c4-732e-406f-8697-f0311803f237`,
        //   method: 'GET',
        //   headers: {
        //     'Range': `bytes=${offset}-`
        //   },
        //   encoding: null
        // }

        // let res = await P_req(ops)

        // get the read stream from IO request (read)
        f.stream = await io.read({
          key,
          fd,
          buf,
          len,
          offset,
          cb
        })
        // if change to other stream source, maybe need to set the encording to null(binary).
        // f.stream.setEncoding(null)

        f.stream
        .on('error', err => {
          debug('[ERROR]-read', err.stack)
          return cb(fuse['EIO'])
        })
        .on('end', () => {
          // destory the stream
          f.stream.destroy()
          f.stream = null

          fd_map.set(fd, f)
        })

        f.offset = offset
        fd_map.set(fd, f)
      }

      function loop() {
        // if the stream was cleared, end the reading operation
        debug('len=%s, offset=%s', len, offset)
        if(len <= 0) return cb(0)

        let result = f.stream.read(len)
        if(!result) return f.stream.once('readable', loop)
        result.copy(buf)
        f.next_offset = offset + len
        fd_map.set(fd, f)

        debug('result length = %s', result.length)
        return cb(result.length)
      }
    }

    gen(f)
    .then(handledLength => {
      // return cb(handledLength)
    }).catch(err => {
      console.log(err)
      return cb(fuse['EIO'])
    })


    // debug('len=%s, offset=%s', len, offset)
    // if(len <= 0) return cb(0)
    // let buffer = new Buffer(len).fill('G')
    // buffer.copy(buf)
    // return cb(len)
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

    let basic_stat = lib.statWrapper({
      mode: mode + octal(40000),  // octal(40000) means that the file is a directory
      size: DIRECTORY_SIZE,
      type: 'directory'
    })

    let meta = {
      stat: basic_stat
    }

    let io_params = {

    }

    let fuse_params = {
      key,
      mode,
      cb
    }

    async function mkdir_gen() {
      try {
        let res_meta = await io.mkdir(meta, io_params, fuse_params)
        let theKey = await fm_ops.putAsync(key, res_meta)
        debug('res_meta', res_meta)
        debug('key', theKey)
        return theKey
      } catch(err) {
        throw err
      }
    }

    mkdir_gen()
    .then(k => cb(0))
    .catch(err => cb(fuse[err.code]))

    // fm_ops.put(key, lib.statWrapper(s, true), (err, k) => {
    //   if(err) return cb(fuse[err.code])
    //   return cb(0)
    // })
  }

  ops.create = function(key, mode, cb) {
    debug('create %s, mode = %s', key, mode)

    // maybe need to handle 'w+' mode which must truncate the size to zero first if the file already exists.
    // ignore now
    let basic_stat = lib.statWrapper({
      mode: mode,
      size: 0,
      type: 'file'
    })

    let meta = {
      stat: basic_stat
    }

    let io_params = {

    }

    let fuse_params = {
      key,
      mode,
      cb
    }

    async function create_gen() {
      try {
        let res_meta = await io.create(meta, io_params, fuse_params)
        let theKey = await fm_ops.putAsync(key, res_meta)
        debug('res_meta', res_meta)
        debug('key', theKey)
        return theKey
      } catch(err) {
        throw err
      }
    }

    create_gen()
    .then(k => ops.open(key, -1, cb))
    .catch(err => cb(fuse[err.code]))

  }

  let c = 0
  ops.write = function(key, fd, buf, len, offset, cb) {
    // maybe need to set status of file to true
    // first time to write, create the detail fo the file (if detial of the file not exists)
    debug('count', ++c)
    debug('write to %s, fd = %s, buffer_len = %s, len = %s, offset = %s', key, fd, buf.length, len, offset)

    try {
      let f = fd_map.get(fd)
      if(!f) return cb(fuse['ENOENT'])
      let s = f.stat

      // copy needed as fuse overrides this buffer
      let copy = new Buffer(len)
      buf.copy(copy)

      if(!f.buf) {
        f.buf = []
        f.count = 0
      }

      f.buf.push(copy)
      f.count++

      fd_map.set(fd, f)
      return cb(len)

    } catch(err) {
      debug('Write Error', err.stack)
      return cb(fuse['EIO'])
    }

    // // just test the stream
    // f.readStream.pipe(fs.createWriteStream('./thedata.txt'))

    // upload the read stream
    // real request
    // f.req_stream = req.put({
    //   url: `http://localhost:3000/storage/v1/70642310-3134-11e6-9e2f-3ffeaedf456b/files/e60aa7c4-732e-406f-8697-f0311803f237`,
    //   encoding: null,
    //   headers: {
    //     'range': 'bytes=0-',
    //   },
    //   formData: {
    //     'file': fs.createReadStream('/src/temp/dummy.txt')
    //   }
    // })

    // f.readStream.pipe(new PassThrough()).pipe(fs.createWriteStream('./a.txt'))

  }

  ops.truncate = function(key, size, cb) {
    debug('truncate %s, size = %s', key, size)
    cb(0)
  }

  return ops

}
