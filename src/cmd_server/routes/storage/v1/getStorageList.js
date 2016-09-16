"use strict"

const debug = require('debug')('cmd-server#getStorageList')

module.exports = function getStorageList(req, res, next) {

  const fuseContext = req.app.get('fuseContext')
  const db = fuseContext.db

  async function getList() {
    try {
      let storage_list = db.storage_ops.getListAsync({})
      return storage_list
    } catch(err) {
      err.status = 500
      throw err
    }
  }

  getList()
  .then(list => {
    return res.status(200).json({
      status: 'success',
      message: 'registered storage list',
      data: list
    })
  })
  .catch(err => next(err))
}
