"use strict"

const debug = require('debug')('cmd-server#updateStorage')
const util = require('util')

module.exports = function updateStorage(req, res, next) {

  const fuseContext = req.app.get('fuseContext')
  const db = fuseContext.db
  const io = fuseContext.io

  let storage_id = req.params.storage_id
  let url = req.body.url || undefined // ignore now
  let auth = req.body.auth || undefined // ignore now
  let otherInfo = req.body.otherInfo || undefined

  const update = async () => {
    try {
      return await io.updateStorage(storage_id, url, auth, otherInfo)
    } catch(err) {
      err.status = 500
      throw err
    }
  }

  update()
  .then(storage_info => {
    debug('storage_info', util.inspect(storage_info, false, null))
    return res.status(200).json({
      status: 'success',
      message: `information of storage-${storage_id} has been updated.`,
      data: [storage_info]
    })
  })
  .catch(err => next(err))
}
