"use strict"

const debug = require('debug')('files')
const path = require('path')
const xtend = require('xtend')
const multiparty = require('multiparty')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const config = require('../../../config/config.json')

const storage_path = path.join(__dirname, config.storage_path)

/**
 * url: PUT -> /fs_id/files/{object_id}
 */
module.exports = function updateFile(req, res, next) {
  debug('headers', req.headers)
  let fs_id = req.params.fs_id
  let object_id = req.params.object_id

  let form = new multiparty.Form()

  form.on('error', err => {
    debug('form error', err)
    err.status = 500
    next(err)
  })
  form.on('part', part => {
    debug('part', part)
    part.resume()
    // if(!part.filename) part.resume()
  })
  form.on('close', () => {
    return res.status(200).json({
      status: 'success'
    })
  })

  // req parse
  form.parse(req)
}
