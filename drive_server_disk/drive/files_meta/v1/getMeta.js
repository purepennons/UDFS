"use strict"

const path = require('path')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))
const config = require('../../../config/config.json')

const storage_path = path.join(__dirname, config.storage_path)

module.exports = function getMeta(req, res, next) {

  // functions
  // read metadata generator
  async function readMetadata(file_path) {
    try {
      let metaStr = await fs.readFileAsync(file_path)
      let meta = {}

      if(metaStr.length > 0) {
        meta = JSON.parse(metaStr)
      } else {
        meta.stat = await fs.statAsync(file_path)
      }

      return meta
    } catch(err) {
      err.status = 500
      err.message = 'Fail to read the metadata from the file.'
      throw err
    }
  }


  // functions end


  let fs_id = req.params.fs_id
  let meta_id = req.params.meta_id

  let target = path.resolve(path.join(storage_path, fs_id, `${meta_id}_meta`))

  fs.accessAsync(target, fs.F_OK)
  .then( () => {
    return readMetadata(target)
  })
  .then(meta => {
    return res.status(200).json({
      status: 'success',
      message: `Get a metadata from ${meta_id} object.`,
      data: [{
        fs_id,
        meta_id,
        meta,
        object_url: `/storage/v1/${fs_id}/files/${meta_id}`
      }]
    })
  }).catch(err => {
    if(err.code === 'ENOENT') return next()
    return next(err)
  })
}
