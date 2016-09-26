"use strict"

const path = require('path')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const config = require('../../../config/config.json')

const storage_path = config.storage_path

module.exports = function deleteMeta(req, res, next) {
  let fs_id = req.params.fs_id
  let meta_id = req.params.meta_id
  let target = path.resolve(path.join(storage_path, fs_id, `${meta_id}_meta`))

  fs.accessAsync(target, fs.F_OK)
  .then( () => {
    return fs.unlinkAsync(target)
  })
  .then( () => {
    return res.status(204).json({
      status: 'success',
      message: `Delete a metadata of the object`,
      data: []
    })
  })
  .catch(err => {
    if(err.code === 'ENOENT') return next()
    return next(err)
  })
}
