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
const EventEmitter = require('events').EventEmitter

const lib = require('../lib/lib')
const Files = require('../lib/files')
const log = require('../lib/log')

// db operations
const file_metadata_ops = require('../secure_db/operations/file_metadata_ops')
const files_ops = require('../secure_db/operations/files_ops')
const general_ops = require('../secure_db/operations/general_ops')

// promisify
const pidUsage = Promise.promisify(require('pidusage').stat)

// global values in the scope
const FD_MAX = 65535
const BLOCK_SIZE = 4096
const DIRECTORY_SIZE = BLOCK_SIZE
const ENOENT = -2

exports.getMainContext = function(root, db, io, options) {
  if(!root || !db || !io) return null

  root = path.resolve(root)

  let fm_ops = file_metadata_ops(db.fileMetadata) // file metadata operations
  let f_ops = files_ops(db.files) // files operation
  let storage_ops = general_ops(db.storageMetadata) // storage operations

  // in order not to change the code, re-assign the variables
  db.fm_ops = fm_ops
  db.f_ops = f_ops
  db.storage_ops = storage_ops

  // ops is the context of fuse
  let ops = {}

  // basic properties
  ops.root = root
  ops.db = db
  ops.io = io

  // ops.options = ['direct_io', 'dev', 'debug']
  ops.options = options.options || []

  // Set to true to force mount the filesystem (will do an unmount first)
  ops.force = true

  // global values in the scope
  let fd_map = new Map()
  let fd_count = 0

  // listen "REGISTER_STORAGE" event, then adds new storage to the map
  let s_map = new Map()

  // listen events
  let e = new EventEmitter()
  ops.events = e

  // event for testing
  e.on('onCMDBoot', data => {
    debug('events:', 'onCMDBoot')
    console.log('Command server is running. The data is received from cmd-server, ', data)
  })

  // data.key = storage_id, data.value = storage_info
  e.on('REGISTER_STORAGE', data => {
    debug('listen REGISTER_STORAGE', data)
    return s_map.set(data.key, data.value)
  })


  // for mesure
  let t_map = new Map()


  // start to monitor
  if(process.env.BENCH && process.env.MONITOR) {
    pidUsage(process.pid)
    .then(stat => {
      log.cpu.info(lib.strF( 'start_monitor', 'cpu', stat.cpu ))
      log.memory.info(lib.strF( 'start_monitor', 'memory', stat.cpu ))
    })
    .catch(err => debug('err', err.stack))

    setInterval(()=> {
      pidUsage(process.pid)
      .then(stat => {
        log.cpu.info(lib.strF( 'monitor', 'cpu', stat.cpu ))
        log.memory.info(lib.strF( 'monitor', 'memory', stat.cpu ))
      })
      .catch(err => debug('err', err.stack))
    }, 250)
  }

  // param: "key" === "path"
  ops.getattr = function(key, cb) {
    debug('getattr = %s', key)

    if(process.env.BENCH && process.env.HANDLER) var eFunc = lib.mt('getattr start')
    fm_ops.getStat(key, (err, s, k) => {
      // debug('getStat error', err)
      if(err) return cb(fuse[err.code])
      debug('stat', s)

      if(process.env.BENCH && process.env.HANDLER) log.handlers.info(lib.strF( key, 'getattr', eFunc('getattr end') ))
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

    if(process.env.BENCH && process.env.HANDLER) var eFunc = lib.mt('open start')
    if(process.env.BENCH && process.env.MULTI_READ && !t_map.get('read_multi')) t_map.set('read_multi', lib.mt('read_multi start'))

    if(fd_count > FD_MAX) return cb(fuse['EMFILE'])
    async function open_gen() {
      let s = await fm_ops.getStatAsync(key)
      debug('s', s)
      debug('s.file_id', s.file_id)
      let fileInfo = await f_ops.getAsync(s.file_id)

      debug('fileInfo', fileInfo)

      let opened_file = {
        flag: lib.parseFlag(flag),
        stat: s,
        fileInfo: Files(fileInfo)
      }

      // genUniqueKeyFromMap need to upgrad the algorithm
      // or it will process too much time to generate the fd number
      let fd = lib.genUniqueKeyFromMap(fd_map, fd_count, FD_MAX)
      debug(`open ${key} -> fd = ${fd}`)

      fd_map.set(fd, opened_file)
      fd_count++

      return fd
    }

    open_gen()
    .then(fd => {
      if(process.env.BENCH && process.env.HANDLER) log.handlers.info(lib.strF( key, 'open', eFunc('open end') ))
      cb(0, fd)
    })
    .catch(err => {
      debug('err', err.stack)
      if(fuse[err.code]) return cb(fuse[err.code])
      return cb(fuse['EBADF'])
    })
  }

  // need to release streams of read and write operations
  ops.release = function(key, fd, cb) {
    debug('release %s, fd = %s', key, fd)

    let f = fd_map.get(fd)
    if(!f) return cb(0)

    let io_params = {
      db,
      f: f,
      e: e,
      s_map: s_map
    }

    let fuse_params = {
      key,
      fd,
      cb
    }

    async function rw_gen() {
      if(f.write) {
        if(f.write.buf) {
          debug('release#f.write')
          let res_meta = await io.write(f.write.buf, io_params, fuse_params)

        }

        if(process.env.BENCH && process.env.HANDLER) {
          let t = t_map.get('write')('write end')
          t_map.delete('write')
          log.io.info(lib.strF( key, 'write', t ))
        }

        if(process.env.BENCH && process.env.MULTI_WRITE) {
          let t = t_map.get('write_multi')('write_multi end')
          t_map.delete('write_multi')
          log.io.info(lib.strF( key, 'write_multi', t ))
        }
      }

      if(f.read) {
        if(process.env.BENCH && process.env.HANDLER) {
          let t = t_map.get('read')('read end')
          t_map.delete('read')
          log.io.info(lib.strF( key, 'read', t ))
        }

        if(process.env.BENCH && process.env.MULTI_READ) {
          let t = t_map.get('read_multi')('read_multi end')
          t_map.delete('read_multi')
          log.io.info(lib.strF( key, 'read_multi', t ))
        }
      }
    }

    rw_gen()
    .then(() => {
      fd_map.delete(fd)
      fd_count--
      return cb(0)
    })
    .catch(err => {
      debug('release_err', err.stack)
      return cb(fuse[err.code])
    })

  }

  ops.read = function(key, fd, buf, len, offset, cb) {
    debug('read from %s, fd = %s, buffer_len = %s, len = %s, offset = %s', key, fd, buf.length, len, offset)

    if(process.env.BENCH && process.env.HANDLER && !t_map.get('read')) t_map.set('read', lib.mt('read start'))

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
     * 若 f.read.stream 存在，next_offset 卻不等於 offset，則銷毀 Stream，重新建立
     */
    async function gen() {
      // end condition
      if(f.read) {
        if(f.read.stream && f.read.next_offset !== offset) {
          // destory the stream
          f.read.stream.destroy()
          f.read.stream = null

          fd_map.set(fd, f)
        }
      }

      if(!f.read) {
        await initStream()
      }

      loop()

      async function initStream() {
        f.read = {}

        let io_params = {
          db,
          f: f,
          e: e,
          s_map: s_map
        }

        let fuse_params = {
          key,
          fd,
          buf,
          len,
          offset,
          cb
        }

        // get the read stream from IO request (read)
        f.read.stream = await io.read(io_params, fuse_params)

        // if change to other stream source, maybe need to set the encording to null(binary).
        // f.read.stream.setEncoding(null)

        f.read.stream
        .on('error', err => {
          debug('[ERROR]-read', err.stack)
          return cb(fuse['EREMOTEIO'])
        })
        .on('end', () => {
          // destory the stream
          f.read.stream.destroy()
          f.read.stream = null

          fd_map.set(fd, f)
        })

        f.read.offset = offset
        fd_map.set(fd, f)
      }

      function loop() {
        // if the stream was cleared, end the reading operation
        debug('len=%s, offset=%s', len, offset)
        if(len <= 0) return cb(0)

        let result = f.read.stream.read(len)
        if(!result) return f.read.stream.once('readable', loop)
        result.copy(buf)
        f.read.next_offset = offset + len
        fd_map.set(fd, f)

        debug('result length = %s', result.length)
        return cb(result.length)
      }
    }

    gen()
    .catch(err => {
      debug('read err', err.stack)
      return cb(fuse['EREMOTEIO'])
    })


    // debug('len=%s, offset=%s', len, offset)
    // if(len <= 0) return cb(0)
    // let buffer = new Buffer(len).fill('G')
    // buffer.copy(buf)
    // return cb(len)
  }

  ops.readdir = function(key, cb) {
    debug('readdir = %s', key)

    if(process.env.BENCH && process.env.HANDLER) var eFunc = lib.mt('readdir start')

    fm_ops.getList(key, (err, files) => {
      if(err) return cb(fuse[err.code])

      files = files.concat(['.', '..'])

      if(process.env.BENCH && process.env.HANDLER) log.handlers.info(lib.strF( key, 'readdir', eFunc('readdir end') ))

      return cb(0, files)
    })
  }

  ops.mkdir = function(key, mode, cb) {
    debug('mkdir %s, mode = %s', key, mode)

    if(process.env.BENCH && process.env.HANDLER) var eFunc = lib.mt('mkdir start')
    let basic_stat = lib.statWrapper({
      mode: mode + octal(40000),  // octal(40000) means that the file is a directory
      size: DIRECTORY_SIZE,
      type: 'directory',
      path: key
    })

    let file_id = basic_stat.file_id

    let meta = {
      stat: basic_stat
    }

    let io_params = {
      db
    }

    let fuse_params = {
      key,
      mode,
      cb
    }

    async function mkdir_gen() {
      try {
        let res_meta = await io.mkdir(meta, io_params, fuse_params)
        res_meta.meta.stat.file_id = file_id
        res_meta.meta.stat.path = key
        let file_meta = {
          file_id: file_id,
          meta: res_meta.meta,
          object_info: {
            etag: '', // current not used
            version: 1,
            storage_id: res_meta.dest.storage_id,
            meta_id: res_meta.meta_id,
            object_id: res_meta.object_id,
            object_url: res_meta.object_url,
            start: 0,
            end: 0,
            size: 0
          },
          path: key
        }
        debug('file_meta', file_meta)

        let put_result = await Promise.all([
          fm_ops.putAsync(key, file_meta),
          f_ops.putAsync(file_id, {
            chunk: [],
            num_of_chunk: 0,
            total_size: 0
          })
        ])
        return put_result
      } catch(err) {
        throw err
      }
    }

    mkdir_gen()
    .then(k => {
      if(process.env.BENCH && process.env.HANDLER) log.handlers.info(lib.strF( key, 'mkdir', eFunc('mkdir end') ))
      cb(0)
    })
    .catch(err => cb(fuse[err.code]))

  }

  ops.create = function(key, mode, cb) {
    debug('create %s, mode = %s', key, mode)

    if(process.env.BENCH && process.env.HANDLER) var eFunc = lib.mt('create start')
    if(process.env.BENCH && process.env.MULTI_WRITE && !t_map.get('write_multi')) t_map.set('write_multi', lib.mt('write_multi start'))

    // maybe need to handle 'w+' mode which must truncate the size to zero first if the file already exists.
    // ignore now
    let basic_stat = lib.statWrapper({
      mode: mode,
      size: 0,
      type: 'file',
      path: key
    })

    let file_id = basic_stat.file_id

    let meta = {
      stat: basic_stat
    }

    let io_params = {
      db
    }

    let fuse_params = {
      key,
      mode,
      cb
    }

    async function create_gen() {
      try {
        let res_meta = await io.create(meta, io_params, fuse_params)
        res_meta.meta.stat.file_id = file_id
        res_meta.meta.stat.path = key
        let file_meta = {
          file_id: file_id,
          meta: res_meta.meta,  // only contain the stat now
          object_info: {
            etag: '', // current not used
            version: 1,
            storage_id: res_meta.dest.storage_id,
            meta_id: res_meta.meta_id,
            object_id: res_meta.object_id,
            object_url: res_meta.object_url,
            start: 0,
            end: 0,
            size: 0
          },
          path: key
        }
        debug('file_meta', file_meta)

        let put_result = await Promise.all([
          fm_ops.putAsync(key, file_meta),
          f_ops.putAsync(file_id, Files({}))
        ])
        return put_result
      } catch(err) {
        throw err
      }
    }

    create_gen()
    .then(result => {
      if(process.env.BENCH && process.env.HANDLER) log.handlers.info(lib.strF( key, 'create', eFunc('create end') ))
      ops.open(key, -1, cb)
    })
    .catch(err => cb(fuse[err.code]))

  }

  let c = 0
  ops.write = function(key, fd, buf, len, offset, cb) {
    // maybe need to set status of file to true
    // first time to write, create the detail fo the file (if detial of the file not exists)
    debug('count', ++c)
    debug('write to %s, fd = %s, buffer_len = %s, len = %s, offset = %s', key, fd, buf.length, len, offset)

    if(process.env.BENCH && process.env.HANDLER && !t_map.get('write')) t_map.set('write', lib.mt('write start'))

    try {
      /*
       * f = {
       * 		flag,
       * 		stat,
       * 		fileInfo
       * }
       */
      let f = fd_map.get(fd)
      if(!f) return cb(fuse['ENOENT'])

      // const writable_flag = ['w', 'w+']
      // if(!writable_flag.indexOf(f.flag)) return cb(fuse['EPERM'])

      // copy needed as fuse overrides this buffer
      let copy = new Buffer(len)
      buf.copy(copy)

      if(!f.write) {
        f.write = {}
        f.write.buf = []
        f.write.offsets = [] // 有待確認運作機制
        f.write.count = 0
        f.write.buf_len = 0
      }

      f.write.buf.push(copy)
      f.write.offsets.push(offset)
      f.write.count++
      f.write.buf_len+=len

      fd_map.set(fd, f)
      return cb(len)

    } catch(err) {
      debug('Write Error', err.stack)
      return cb(fuse['EIO'])
    }

  }

  ops.truncate = function(key, size, cb) {
    debug('truncate %s, size = %s', key, size)

    ops.open(key, -1, fd => ops.ftruncate(key, fd, size, cb))
  }

  ops.ftruncate = function(key, fd, size, cb) {
    debug('ftruncate %s, size = %s', key, size)

    if(process.env.BENCH && process.env.HANDLER) var eFunc = lib.mt('ftruncate start')

    let f = fd_map.get(fd)
    if(!f) return cb(fuse['ENOENT'])

    if(!f.write) {
      f.write = {}
      f.write.buf = []
      f.write.offsets = [] // 有待確認運作機制
      f.write.count = 0
      f.write.buf_len = 0
    }

    let len = (size <= f.stat.size)? 0: size - f.stat.size
    f.write.buf.push( Buffer.alloc(len) )
    f.write.offsets.push( (size <= f.stat.size)? size: f.stat.size )
    f.write.count++
    f.write.buf_len = len

    fd_map.set(fd, f)

    let io_params = {
      db,
      f: f,
      e: e,
      s_map: s_map
    }

    let fuse_params = {
      key,
      fd,
      size,
      cb
    }

    async function truncate() {
      try {
        // just set buffer size to zero and offset is equal to the truncate size.
        // do same thing as write operation
        let res_meta = await io.write(f.write.buf, io_params, fuse_params)
        return res_meta
      } catch(err) {
        throw err
      }
    }

    truncate()
    .then(() =>  {
      if(process.env.BENCH && process.env.HANDLER) log.handlers.info(lib.strF( key, 'ftruncate', eFunc('ftruncate end') ))
      return cb(0)
    })
    .catch(err => {
      debug('ftruncate_err', err.stack)
      return cb(fuse[err.code])
    })

  }

  return ops

}
