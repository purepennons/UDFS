"use strict"
const debug = require('debug')('fuse-io')
const Promise = require('bluebird')
const octal = require('octal')
const uuid = require('node-uuid')
const util = require('util')
const Buffer = require('buffer').Buffer

// IO requests must pass to middleware before handling the requests
const R = require('./requests')
const policy = require('./policy')
const stat = require('../lib/stat')
const lib = require('../lib/lib')
const Chunk = require('../lib/chunk')
const Files = require('../lib/files')

// db operations
const file_metadata_ops = require('../secure_db/operations/file_metadata_ops')
const files_ops = require('../secure_db/operations/files_ops')
const general_ops = require('../secure_db/operations/general_ops')

class IO {
  constructor(db) {
    if(!db) throw new Error('Without a leveldb instance for IO class.')
    this.db = db
    this.fm_ops = file_metadata_ops(db.fileMetadata) // file metadata operations
    this.f_ops = files_ops(db.files) // files operation
    this.storage_ops = general_ops(db.storageMetadata) // storage operations
  }

  /*
   * @param {object} fuse_params - fuse_params are equal to the params of operations of FUSE
   */
  // need to impelement all io methods for fuse operations
  read(fuse_params) {
    // retuan a readStream
    return new Promise((resolve, reject) => {
      R.File.get('http://localhost:3000', '70642310-3134-11e6-9e2f-3ffeaedf456b', 'e60aa7c4-732e-406f-8697-f0311803f237', fuse_params.offset, null)
      .then(rs => {
        // pass middleware here. e.g. resolve(mid2(mid1(rs))) or resolve(rs.pipe(mid1).pipe(mid2)) where mid is a function will return a read stream or a transform stream
        return resolve(rs)
      })
      .catch(err => {
        if(!err.code) err.code = 'EIO'
        return reject(err)
      })
    })
  }

  /*
   * @param {object} source - source is a readable stream from write operation of FUSE
   * @param {object} io_params - only has f property. (fileInfo, write, flag, stat)
   * 目前 source 暫時是一個 buffer array e.g. [buf1, buf2, ..., bufn]
   */
  write(source, io_params, fuse_params) {
    /*
     * TODO:
     * source 目前是 buffer array，可以先轉換成 read stream 再 transform，
     * 最後再轉回 buffer (by concat-stream module)
     */
    return new Promise((resolve, reject) => {
      async function write_gen() {
        try {

          let f = io_params.f

          // if chunk array is empty, initial a object
          if(f.fileInfo.chunk_arr.length === 0) {
            // get a dest to store the object
            let dest = policy.getObjDest(null)

            // create a new file
            let res_meta = await R.FileMeta.create(dest.hostname, dest.fs_id, null)
            let first_obj = lib.objectWrapper({}, {
              storage_id: dest.storage_id,
              meta_id: res_meta.meta_id,
              object_id: res_meta.meta_id,
              object_url: res_meta.object_url
            })
            debug('first_obj', first_obj)

            f.fileInfo.push(lib.chunkWrapper({}, {
              chunk_order: 1,
              read: [first_obj],
              write: [first_obj],
              chunk_size: 0,
              current_size: 0
            }))

            debug('f.fileInfo', util.inspect(f.fileInfo, false, null))
          }

          // transform the data
          // current: just concat the buffer
          let w_data = Buffer.concat(f.write.buf, f.write.buf_len)

          // start to write the data to storage
          // await R.File.update()


        } catch(err) {
          throw err
        }
      }

      write_gen().catch(err => debug('write_gen err', err.stack))
    })
  }

  mkdir(meta, io_params, fuse_params) {
    return this.create(meta, io_params, fuse_params)
  }

  create(meta, io_params, fuse_params) {
    return new Promise((resolve, reject) => {
      // define storage policy of metadata
      let dest = policy.getMetaDest(null)

      /*
       * TODO: change to correct fs_id
       */
      let fs_id = dest.fs_id

      // if(!meta) return reject()
      if(!meta.stat.file_id) {
        meta.stat.file_id = uuid.v1()
      }
      meta.stat = stat(meta.stat)

      // create a new file (only about metadata)
      R.FileMeta.create(dest.hostname, fs_id, meta)
      .then(res_meta => {
        res_meta.dest = dest
        return resolve(res_meta)
      })
      .catch(err => {
        if(!err.code) err.code = 'EIO'
        return reject(err)
      })
    })
  }
}

module.exports = IO
