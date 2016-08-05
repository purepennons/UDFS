"use strict"
const debug = require('debug')('fuse-io')
const Promise = require('bluebird')
const octal = require('octal')
const uuid = require('node-uuid')

// IO requests must pass to middleware before handling the requests
const R = require('./requests')
const policy = require('./policy')
const stat = require('../lib/stat')

// db operations
const file_metadata_ops = require('../secure_db/operations/file_metadata_ops')
const files_ops = require('../secure_db/operations/files_ops')

class IO {
  constructor(db) {
    if(!db) throw new Error('Without a leveldb instance for IO class.')
    this.db = db
    this.fm_ops = file_metadata_ops(db.fileMetadata) // file metadata operations
    this.f_ops = files_ops(db.files) // files operation
  }

  // @param {object} fuse_params - fuse_params are equal to the params of operations of FUSE

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
   */
  write(source, fuse_params) {
    // source need to pipe to a writestream
  }

  mkdir(fuse_params) {
    // do nothing
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
