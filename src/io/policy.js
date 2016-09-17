"use strict"

const debug = require('debug')('fuse-io#policy')

// const
const TEMP_STORAGE_ID = 'storage-1234567890'
const TEMP_FS_ID = '70642310-3134-11e6-9e2f-3ffeaedf456b'

/*
 * destination define
 * @param {object} ops - pass all options needed
 * @return {string} storage info
 */
exports.getMetaDest = async (db, key, io_params, fuse_params) => {

  try {
    let storage_list = await db.storage_ops.getListAsync({})

    debug('storage_list', storage_list)
    debug('type', typeof storage_list[0])

    if(storage_list.length === 0) {
      let err = new Error('Current number of registered storage is zero. Must register a storage first.')
      err.code = 'ENXIO'
      throw err
    }

    // just return the first storage
    return {
      storage_id: storage_list[0].key,
      fs_id: storage_list[0].value.fs_id,
      protocol: storage_list[0].value.protocol,
      host: storage_list[0].value.host,
      port: storage_list[0].value.port,
      hostname: storage_list[0].value.hostname
    }
  } catch(err) {
    throw err
  }
}

exports.getObjDest = async (db, key, io_params, fuse_params) => {
  try {
    let storage_list = await db.storage_ops.getListAsync({})

    debug('storage_list', storage_list)
    debug('type', typeof storage_list[0])

    if(storage_list.length === 0) {
      let err = new Error('Current number of registered storage is zero. Must register a storage first.')
      err.code = 'ENXIO'
      throw err
    }

    // just return the first storage
    return {
      storage_id: storage_list[0].key,
      fs_id: storage_list[0].value.fs_id,
      protocol: storage_list[0].value.protocol,
      host: storage_list[0].value.host,
      port: storage_list[0].value.port,
      hostname: storage_list[0].value.hostname
    }
  } catch(err) {
    throw err
  }
}
