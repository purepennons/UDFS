"use strict"
const debug = require('debug')('fuse-io')
const Promise = require('bluebird')
const uuid = require('node-uuid')
const util = require('util')
const Buffer = require('buffer').Buffer
const url = require('url')
const shortid = require('shortid')
const xtend = require('xtend')

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

function err_handler(err) {
  switch(err.code) {
    case 'NOTFOUND':
      err.code = 'ENODEV'
      break
    default:
      err.code = 'EREMOTEIO'
  }
  throw err
}

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
  async read(io_params, fuse_params) {
    // retuan a readStream
    debug('io_params', util.inspect(io_params, false, null))
    try {
      /*
      * 假設目前一個 file 只會有一個 chunk。
      * 每個 chunk 的 object 來源只會有一個。
      */

      let f = io_params.f
      let chunk = f.fileInfo.chunk_arr[0] // read only

      /*
       * BUG: if reading the file before write once, it will throw a error.
       * Because of the empty chunk
       */
      let objInfo = chunk.read[0] // read only
      let storage_id = objInfo.storage_id

      // get storage info
      // try to query from memory
      let dest = io_params.s_map.get(storage_id)

      // query from DB
      if(!dest) {
        dest = await this.storage_ops.getAsync(storage_id)
        // update the s_map
        io_params.e.emit('REGISTER_STORAGE', {key: storage_id, value: dest})
      }

      let rs = await R.File.get(dest.hostname, dest.fs_id, objInfo.object_id, fuse_params.offset, null)
      // pass middleware here. e.g. resolve(mid2(mid1(rs))) or resolve(rs.pipe(mid1).pipe(mid2)) where mid is a function will return a read stream or a transform stream

      return rs

    } catch(err) {
      err_handler(err)
    }
  }

  /*
   * @param {object} source - source is a readable stream from write operation of FUSE
   * @param {object} io_params - has f(fileInfo, write, flag, stat), e, s_map properties.
   * 目前 source 暫時是一個 buffer array e.g. [buf1, buf2, ..., bufn]
   */
  async write(source, io_params, fuse_params) {
    /*
     * TODO:
     * 1. source 目前是 buffer array，可以先轉換成 read stream 再 transform，
     * 最後再轉回 buffer (by concat-stream module)
     * 2. 允許多個 chunk
     */
    try {

      let f = io_params.f

      // if chunk array is empty, initial a object
      if(f.fileInfo.chunk_arr.length === 0) {
        // get a dest to store the object
        let dest = await policy.getObjDest(this.db, fuse_params.key ,io_params, fuse_params)

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

      /*
      * 假設目前一個 file 只會有一個 chunk。
      * 每個 chunk 的 object 來源只會有一個。
      */
      let chunk = f.fileInfo.chunk_arr.pop()
      let objInfo = chunk.write.pop()
      let storage_id = objInfo.storage_id

      // get storage info
      // try to query from memory
      let dest = io_params.s_map.get(storage_id)

      // query from DB
      if(!dest) {
        dest = await this.storage_ops.getAsync(storage_id)
        debug('dest', dest)
        // update the s_map
        io_params.e.emit('REGISTER_STORAGE', {key: storage_id, value: dest})
      }

      // transform the data
      // current: just concat the buffer
      let w_data = Buffer.concat(f.write.buf, f.write.buf_len)

      // start to write the data to storage
      let update_res = await R.File.update(dest.hostname, dest.fs_id, objInfo.object_id, f.write.offsets[0], {
        filename: objInfo.object_id,
        blob: w_data,
        len: f.write.buf_len
      })
      debug('update_res', util.inspect(update_res, false, null))

      // update fileMetadata & files
      /*
       * TODO:
       * 1. update remote metadata of main file
       * 2. check read/write source is needed to update or not
       */

      const updateDB = async () => {
        // don't forget to update atime and mtime
        let w_update_obj = lib.objectWrapper(objInfo, {
          etag: '',
          version: objInfo.version + 1,
          meta_id: update_res.meta_id,
          object_id: update_res.object_id,
          object_url: update_res.object_url,
          start: f.write.offsets[0],  // 實際上應該加上上一個 current_size
          end: f.write.offsets[0] + update_res.meta.stat.size,
          size: update_res.meta.stat.size
        })

        // DB#fileMeta
        // lib.statWrapper will update the atime and mtime
        update_res.meta.stat.file_id = f.stat.file_id
        update_res.meta.stat.path = fuse_params.key
        update_res.meta.stat = lib.statWrapper(update_res.meta.stat, true, {atimeUpdate: true, mtimeUpdate: true})
        let update_file_meta = lib.fileMetaWrapper({}, {
          file_id: f.stat.file_id,
          meta: update_res.meta,
          object_info: w_update_obj,
          path: fuse_params.key
        })

        // DB#files
        /*
         * TODO: 確認是否要更新 chunk.read
         */
        chunk.write.push(w_update_obj)

        if(!lib.isSameSrc(chunk.read[0], w_update_obj)) {
          chunk.read.unshift(w_update_obj)
        }
        let update_chunk = lib.chunkWrapper(chunk, {
          write: chunk.write,
          read: chunk.read,
          chunk_size: w_update_obj.size,
          current_size: 0 // not used
        })

        // push chunk to fileInfo.chunk_arr
        f.fileInfo.push(update_chunk, w_update_obj.size)

        debug('stat', f.stat)
        debug('w_update_obj', util.inspect(w_update_obj, false, null))
        debug('update_file_meta', util.inspect(update_file_meta, false, null))
        debug('update_chunk', util.inspect(update_chunk, false, null))
        debug('f.fileInfo', util.inspect(f.fileInfo, false, null))

        // update DB
        await Promise.all([
          this.fm_ops.updateAsync(fuse_params.key, update_file_meta),
          this.f_ops.updateAsync(f.stat.file_id, f.fileInfo)
        ])

        return {
          fileMeta: update_file_meta,
          fileInfo: f.fileInfo
        }
      }

      return await updateDB()

    } catch(err) {
      err_handler(err)
    }
  }

  mkdir(meta, io_params, fuse_params) {
    return this.create(meta, io_params, fuse_params)
  }

  async create(meta, io_params, fuse_params) {
    try {
      // define storage policy of metadata
      let dest = await policy.getMetaDest(this.db, fuse_params.key ,io_params, fuse_params)

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

      let res_meta = await R.FileMeta.create(dest.hostname, fs_id, meta)
      res_meta.dest = dest

      return res_meta
    } catch(err) {
      switch(err.code) {
        case 'ENXIO':
          err.code = 'ENXIO'
        default:
          err.code = 'EREMOTEIO'
      }

      throw err
    }
  }




  // io requests which may called from cmd-server
  async register(storage_url=undefined, auth={}, otherInfo={}) {
    // auth current is not used

    try {
      let url_parse = url.parse(storage_url)

      // send the request to register the storage

      let res_data = await R.FileSystem.create(storage_url, auth)

      // generate a storage_id
      let storage_id = shortid.generate()

      // write data to DB#storageMetadata
      let info = {
        fs_id: res_data.fs_id,
        hostname: storage_url,
        protocol: url_parse.protocol.slice(0, url_parse.protocol.length - 1),
        host: url_parse.host,
        port: url_parse.port,
        auth: auth,
        otherInfo: otherInfo
      }

      await this.storage_ops.putAsync(storage_id, info)

      info.storage_id = storage_id

      return info

    } catch(err) {
      throw err
    }
  }

  async updateStorage(storage_id=undefined, storage_url=undefined, auth=undefined, otherInfo=undefined) {
    try {
      if(!storage_id) {
        let err = new Error('without the storage_id')
        err.code = 'ENXIO'
        throw err
      }

      let storage_info = await this.storage_ops.getAsync(storage_id)

      // pre-processing the data
      if(storage_url) {
        let url_parse = url.parse(storage_url)
        storage_info.hostname = storage_url
        storage_info.protocol = url_parse.protocol.slice(0, url_parse.protocol.length - 1)
        storage_info.host = url_parse.host
        storage_info.port = url_parse.port
      }

      // extend props from 'auth' and 'otherInfo' properties of storage_info

      storage_info.auth = lib.deepXtend(storage_info.auth, auth)
      storage_info.otherInfo = lib.deepXtend(storage_info.otherInfo, otherInfo)

      debug('update_storage_info', storage_info)

      // update the storage_info
      await this.storage_ops.updateAsync(storage_id, storage_info)

      storage_info.storage_id = storage_id
      return storage_info

    } catch(err) {
      throw err
    }
  }
}

module.exports = IO
