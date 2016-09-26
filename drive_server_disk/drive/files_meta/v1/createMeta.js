"use strict"

const debug = require('debug')('file_meta')
const path = require('path')
const uuid = require('node-uuid')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const config = require('../../../config/config.json')

const storage_path = config.storage_path

/**
 * url: POST -> /{fs_id}/meta/create
 * body: {
 *   meta: {
 *     stat,
 *     otherInfo
 *   }
 * }
 */
module.exports = function createMeta(req, res, next) {
  let fs_id = req.params.fs_id
  let meta = req.body.meta || undefined
  if(meta) meta = JSON.parse(meta)

  let storage_folder = path.resolve(path.join(storage_path, fs_id))
  debug('folder', storage_folder);
  // check the bucket of file system exists or not
  fs.accessAsync(storage_folder, fs.F_OK)
  .then(() => {
    let meta_id = uuid.v4() // it is same as the object_id here. random-generation

    // run generator
    createMetaAndEmpty(meta_id, meta)
    .then(meta => {
      return res.status(201).json({
        status: 'success',
        message: 'create a empty file and its metadata',
        data: [{
          fs_id,
          meta_id,
          meta,
          object_id: meta_id,
          object_url: `/storage/v1/${fs_id}/files/${meta_id}`
        }]
      })
    }).catch(err => next(err))
  })
  .catch(err => {
    err.status = 403
    err.message = 'Need to registry the file system before creating files.'
    next(err)
  })

  // functions
  async function createMetaAndEmpty(meta_id, meta={}) {
    // create a empty file and response the metadata
    try {
      if(!meta) meta = {}

      // create the meta file
      let meta_fd = await fs.openAsync(path.join(storage_folder, `${meta_id}_meta`), 'w')
      // empty file for real data
      let fd = await fs.openAsync(path.join(storage_folder, meta_id), 'w')

      // if body.meta.stat exists, return the meta
      // or the stat of meta will be the stat of the file
      meta.stat = meta.stat || await fs.fstatAsync(fd)

      // write the metadata to meta file
      await fs.writeAsync(meta_fd, JSON.stringify(meta))

      // release file
      fs.close(fd)
      fs.close(meta_fd)

      return meta
    } catch(err) {
      err.status = 500
      err.message = 'fail to create a empty file'
      throw err
    }
  }

}
