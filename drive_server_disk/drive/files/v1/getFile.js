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
  let meta_target = path.join(storage_folder, `${meta_id}_meta`)

  debug('range', range)
  Promise.all([
    fs.statAsync(target),
    fs.readFileAsync(meta_target)
  ])
  .then(result => {
    let stat = result[0]  // the stat of real file
    let meta = result[1]  // the metadata of the real file from meta file
    meta = JSON.parse(meta) // assume that it will never be failed.

    // 實務上，meta file 記錄的 file size 有可能小於或大於當前實際儲存在 file 的 file size
    // 因此需要額外判斷取得的檔案內容，是否符合目前的 meta file 的設定
    // if size of meta file > size of real file => return size of real file
    // if size of meta file < size of real file => return size of meta file
    let rs = null // readable stream
    let real_end_position = (meta.stat.size > stat.size)? stat.size: meta.stat.size
    if(!range) {
      debug('full read')
      // if range === null, return whole content
      // 因為 middleware 要強制有 range header，所以暫時無用
      rs = fs.createReadStream(target, {end: real_end_position})
    } else if(range[0].start >= 0 && range[0].end === MAX_FILE_SIZE-1) {
      debug('partial read, only assgin start value')
      // if only has start range, return the partial content from start to the end of the file
      rs = fs.createReadStream(target, {
        start: range[0].start,
        end: real_end_position - 1  // because end option include the byte.
      })
    } else if(range[0].start >= 0 && range[0].end <= meta.stat.size) {
      debug('partial read, start and end values are both assigned')
      rs = fs.createReadStream(target, {
        start: range[0].start,
        end: (range[0].end <= real_end_position)? range[0].end: real_end_position
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
