"use strict"

const debug = require('debug')('cmd-server#registerStorage')

/*
 * POST -> /storages/create
 * params: {
 * 	storage_info: {
 * 		url: 'storage url',
 * 		auth: {},
 * 		otherInfo: {}
 * 	}
 * }
 */

module.exports = function getStorageList(req, res, next) {

  const fuseContext = req.app.get('fuseContext')
  const db = fuseContext.db
  const io = fuseContext.io

  let storage_info = req.body.storage_info

  debug('storage_info', typeof storage_info)
  debug('storage_info', storage_info)

  async function register() {
    try {
      // let storage_info = JSON.parse(storage_info)
      if(!storage_info.url) throw new Error('Without the storage url')

      return await io.register(storage_info.url, storage_info.other)

    } catch(err) {
      err.status = 500
      throw err
    }
  }

  register()
  .then(registered_info => {
    return res.status(201).json({
      status: 'success',
      message: 'a storage has been attached.',
      data: [registered_info]
    })
  })
  .catch(err => next(err))
}
