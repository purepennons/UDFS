"use strict"

const debug = require('debug')('files')
const path = require('path')
const Promise = require('bluebird')

const fs = Promise.promisifyAll(require('fs-extra'))

const config = require('../../../config/config.json')

const storage_path = path.join(__dirname, config.storage_path)

// set max size of the file to 1 TB
const MAX_FILE_SIZE = config.MAX_FILE_SIZE

module.exports = function getFile(req, res, next) {
  let fs_id = req.params.fs_id
  let object_id = req.params.object_id
  let meta_id = object_id // in this driver, the object_id will be same as the meta_id
  let range = req.range

  let storage_folder = path.resolve(path.join(storage_path, fs_id))
  let target = path.join(storage_folder, `${object_id}`)

  debug('range', range)
  fs.statAsync(target)
  .then(stat => {
    let rs = null // readable stream
    if(!range) {
      debug('full read')
      // if range === null, return whole content
      // 因為 middleware 要強制有 range header，所以暫時無用
      rs = fs.createReadStream(target, {end: stat.size})
    } else if(range[0].start >= 0 && range[0].end === MAX_FILE_SIZE-1) {
      debug('partial read, only assgin start value')
      // if only has start range, return the partial content from start to the end of the file
      rs = fs.createReadStream(target, {
        start: range[0].start,
        end: stat.size - 1  // because end option include the byte.
      })
    } else if(range[0].start >= 0 && range[0].end <= stat.size) {
      debug('partial read, start and end values are both assigned')
      rs = fs.createReadStream(target, {
        start: range[0].start,
        end: range[0].end
      })
    } else {
      // ignore this request
      let err = new Error('unsatisfiable range')
      err.status = 416
      return next(err)
    }

    rs.on('error', err => {
      err.status = 500
      err.message = 'Something wrong when sending the content'
      return next(err)
    })
    rs.pipe(res)
  })
  .catch(err => {
    if(err.code === 'ENOENT') return next()
    err.status = 500
    return next(err)
  })

}
