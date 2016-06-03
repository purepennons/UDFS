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
  let fs_id = req.params.fs_id
  let object_id = req.params.object_id
  let meta_id = object_id // in this driver, the object_id will be same as the meta_id
  let len = req.headers['content-length'] // the value is not correct and not used
  let range = req.range

  if(!len) {
    let err = new Error('Content-Length header must be assigned')
    err.status = 400
    return next(err)
  }

  // start to accept the file
  let storage_folder = path.resolve(path.join(storage_path, fs_id))
  let target = path.join(storage_folder, `${object_id}`)
  let meta_target = path.join(storage_folder, `${meta_id}_meta`)

  fs.accessAsync(target, fs.F_OK)
  .then(() => {
    // read old meta
    return fs.readFileAsync(meta_target)
  })
  .then(old_meta => {
    old_meta = JSON.parse(old_meta) // assume that it will never be failed.

    // check the size of file is matched to the range before updating
    if(range[0].start > old_meta.stat.size) {
      let err = new Error('out of range')
      err.status = 416
      return next(err)
    }

    let form = new multiparty.Form()
    let uploadFlag = false  // only allow one file to be uploaded

    form.on('error', err => {
      debug('err', err)
      err.status = 500
      next(err)
    })
    form.on('part', part => {
      // part is a readable stream
      if(!part.filename || uploadFlag) part.resume()

      uploadFlag = true
      let ws = fs.createWriteStream(target, {
        flags: 'r+',
        start: range[0].start
      })

      ws
      .on('error', err => {
        debug('err', err)
        err.status = 500
        err.message = 'something wrong when writing the data'
        return next(err)
      })
      .on('close', () => {
        async function updateMeta() {
          let stat = await fs.statAsync(target)
          // debug('stat', stat)

          // update the metadata
          let meta = {}
          meta['stat'] = xtend(old_meta['stat'], stat)
          let meta_fd = await fs.openAsync(meta_target, 'w')
          await fs.writeAsync(meta_fd, JSON.stringify(meta))

          // release
          fs.close(meta_fd)
          return meta
        }

        // update and response
        updateMeta()
        .then(stat => {
          return res.status(200).json({
            status: 'success',
            message: `${object_id} object was updated from ${range[0].start} position`,
            data: []
          })
        })
        .catch(err => {
          debug('err', err)
          err.status = 500
          err.message = 'something wrong when updating the metadata'
          return next(err)
        })
      })

      // write the data
      part.pipe(ws)

    })
    form.on('close', () => {
      // do nothing
    })

    // req parse
    form.parse(req)
  })
  .catch(err => {
    if(err.code === 'ENOENT') return next()
    err.status = 500
    return next(err)
  })

}
