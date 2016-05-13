"use strict"

const debug = require('debug')('file_meta')
const path = require('path')
const uuid = require('node-uuid')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const config = require('../../../config/config.json')


const storage_path = path.join(__dirname, config.storage_path)
module.exports = function createMeta(req, res, next) {
  let fs_id = req.params.fs_id

  let storage_folder = path.resolve(path.join(storage_path, fs_id))
  debug('folder', storage_folder);
  // check the bucket of file system exists or not
  fs.accessAsync(storage_folder, fs.F_OK)
  .then(() => {
    let meta_id = uuid.v4() // it is same as the object_id here. random-generation

    // run generator
    createEmpty(meta_id)
    .then(stat => {
      return res.status(201).json({
        status: 'success',
        message: 'create a empty file and its metadata',
        data: [{
          meta_id,
          stat,
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
  async function createEmpty(meta_id) {
    try {
      // create a empty file and response the stat
      let fd = await fs.openAsync(path.join(storage_folder, meta_id), 'w')
      return await fs.fstatAsync(fd)
    } catch(err) {
      err.status = 500
      err.message = 'fail to create a empty file'
      throw err
    }
  }

}
