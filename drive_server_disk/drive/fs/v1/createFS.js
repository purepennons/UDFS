"use strict"

const debug = require('debug')('fs')
const path = require('path')
const uuid = require('node-uuid')
const Promise = require('bluebird')
const mkdirs = Promise.promisify(require('fs-extra').mkdirs)

const config = require('../../../config/config.json')

const storage_path = path.join(__dirname, config.storage_path) // will be setted by configuration

module.exports = function createFS(req, res, next) {
  let fs_id = uuid.v1() // time-based

  debug('fs_path', storage_path);
  mkdirs(path.resolve(path.join(storage_path, fs_id)))
  .then( () => {
    return res.status(201).json({
      status: 'success',
      message: 'Create a new file system bucket.',
      data: [{
        fs_id
      }]
    })
  })
  .catch(err => {
    debug('[ERROR]', err)
    err.status = 500
    return next(err)
  })
}
