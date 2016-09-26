"use strict"

const path = require('path')
const xtend = require('xtend')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const config = require('../../../config/config.json')

const storage_path = config.storage_path

/**
 * url: PUT -> /{fs_id}/meta/{meta_id}
 * body: {
 *   meta: Object
 *   ...
 * }
 *
 */

module.exports = function updateMeta(req, res, next) {
  // functions
  // generator
  async function updateMeta(file_path, meta_id, meta) {
    try {
      let origin_meta = await fs.readFileAsync(file_path)
      origin_meta = JSON.parse(origin_meta)

      Object.keys(meta).map(key => {
        origin_meta[key] = xtend(origin_meta[key], meta[key])
      })

      let meta_fd = await fs.openAsync(file_path, 'w')
      await fs.writeAsync(meta_fd, JSON.stringify(origin_meta))

      // release
      fs.close(meta_fd)

      return origin_meta
    } catch(err) {
      err.status = 500
      err.message = 'Something wrong when updating the metadata'
      throw err
    }
  }

  // functions end



  let fs_id = req.params.fs_id
  let meta_id = req.params.meta_id
  let meta = req.body.meta || null
  if(meta) meta = JSON.parse(meta)
  let storage_folder = path.resolve(path.join(storage_path, fs_id))
  let target = path.join(storage_folder, `${meta_id}_meta`)

  fs.accessAsync(target, fs.F_OK)
  .then( () => {
    if(!meta) {
      return res.status(304).json({
        status: 'success',
        message: 'Not Modified',
        data: []
      })
    }
    return updateMeta(target, meta_id, meta)
  })
  .then(meta => {
    return res.status(200).json({
      status: 'success',
      message: `the metadata of ${meta_id} object was updated`,
      data: [{
        fs_id,
        meta_id,
        meta,
        object_url: `/storage/v1/${fs_id}/files/${meta_id}`
      }]
    })
  }).catch(err => {
    if(err.code === 'ENOENT') return next()
    err.status = 500
    return next(err)
  })

}
