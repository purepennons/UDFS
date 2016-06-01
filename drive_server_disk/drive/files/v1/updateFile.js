"use strict"

const debug = require('debug')('files')
const path = require('path')
const xtend = require('xtend')
const multiparty = require('multiparty')
const rangeParser = require('range-parser')
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
  let len = req.headers['content-length'] // the value is not correct

  // range parsing
  let range = req.headers['range']
  try {
    // set max size of the file to 1 TB
    range = rangeParser(1024*1024*1024*1024, range)
    debug('range', range)
  } catch(err) {
    range = null
  }

  if(!range || !len) {
    let err = new Error('Content-Length and Range headers must be assigned')
    err.status = 400
    return next(err)
  }

  // 單位錯誤或格式錯誤
  if(range === -1 || range.type !== 'bytes') {
    let err = new Error('Bad unit or format of range')
    err.status = 416
    return next(err)
  }

  // range 範圍錯誤
  if(range === -2) {
    let err = new Error('unsatisfiable range')
    err.status = 416
    return next(err)
  }

  // start to accept the file
  let storage_folder = path.resolve(path.join(storage_path, fs_id))
  let target = path.join(storage_folder, `${object_id}`)
  let meta_target = path.join(storage_folder, `${meta_id}_meta`)

  async function updateFile() {
    // read old meta
    let old_meta = await fs.readFileAsync(meta_target)
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
      debug('form error', err)
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
      part.pipe(ws)
    })
    form.on('close', () => {
      debug('GGGGGGGGGGGGGGGGGG')
      async function updateMeta() {
        let stat = await fs.statAsync(target)
        debug('stat', stat)

        // update the metadata
        old_meta['stat'] = xtend(old_meta['stat'], stat)
        let meta_fd = await fs.openAsync(file_path, 'w')
        await fs.writeAsync(meta_fd, JSON.stringify(old_meta))

        // release
        fs.close(meta_fd)
        return stat
      }

      updateMeta().then(() => {
        // response
        return res.status(200).json({
          status: 'success',
          message: `${object_id} object was updated from ${range[0].start} position`,
          data: []
        })
      }).catch(err => {
        err.status = 500
        return next(err)
      })
    })

    // req parse
    form.parse(req)

    return
  }

  fs.accessAsync(target, fs.F_OK)
  .then( () => {
    return updateFile()
  })
  .catch(err => {
    if(err.code === 'ENOENT') return next()
    err.status = 500
    return next(err)
  })
}
