"use strict"

const debug = require('debug')('cmd-server#getStorage')

module.exports = function getStorageList(req, res, next) {

  const fuseContext = req.app.get('fuseContext')
  const db = fuseContext.db

  let storage_id = req.params.storage_id || ''

  async function getStorageInfo() {
    try {
      let storage_info = db.storage_ops.getAsync(storage_id)
      return storage_info
    } catch(err) {
      switch(err.code) {
        case 'NOTFOUND':
          err.status = 404
          break
        default:
          err.status = 500
      }
      throw err
    }
  }

  getStorageInfo()
  .then(storage_info => {
    storage_info.storage_id = storage_id
    return res.status(200).json({
      status: 'success',
      message: 'storage information',
      data: [storage_info]
    })
  })
  .catch(err => next(err))
}
