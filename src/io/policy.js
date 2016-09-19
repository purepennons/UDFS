"use strict"

const debug = require('debug')('fuse-io#policy')

const lib = require('../lib/lib')
const m_policy = require('./middlewares/policy/index')

// const
// const TEMP_STORAGE_ID = 'storage-1234567890'
// const TEMP_FS_ID = '70642310-3134-11e6-9e2f-3ffeaedf456b'

// the random_policy is the last policy to get the destination
const random_policy = async (db, key, io_params, fuse_params, storage_list) => {
  try {
    let candidate_storage = -1
    if(storage_list.length > 1) {
      candidate_storage = lib.getRandomInt(0, storage_list.length - 1)
    } else {
      candidate_storage = 0
    }

    return {
      storage_id: storage_list[candidate_storage].key,
      fs_id: storage_list[candidate_storage].value.fs_id,
      protocol: storage_list[candidate_storage].value.protocol,
      host: storage_list[candidate_storage].value.host,
      port: storage_list[candidate_storage].value.port,
      hostname: storage_list[candidate_storage].value.hostname
    }
  } catch(err) {
    return null
  }
}

// const next = (o) => {
//   return o
// }

/*
 * destination define
 * @param {object} ops - pass all options needed
 * @return {string} storage info
 */
exports.getMetaDest = async (db, key, io_params, fuse_params) => {

  try {
    let storage_list = await db.storage_ops.getListAsync({})

    if(storage_list.length === 0) {
      let err = new Error('Current number of registered storage is zero. Must register a storage first.')
      err.code = 'ENXIO'
      throw err
    }

    let dest = undefined
    // get dest by custom middleware
    storage_list = await m_policy.extensionType(db, key, io_params, fuse_params, storage_list)
    debug('extension_storage:', storage_list)

    // last policy: random policy
    dest = await random_policy(db, key, io_params, fuse_params, storage_list)
    debug('getMetaDest:', dest)

    if(dest) {
      return dest
    } else {
      let err = new Error('No candidate storage.')
      err.code = 'ENXIO'
      throw err
    }

  } catch(err) {
    debug('getMetaDest_error', err.stack)
    throw err
  }
}

exports.getObjDest = async (db, key, io_params, fuse_params) => {

  try {
    let storage_list = await db.storage_ops.getListAsync({})

    if(storage_list.length === 0) {
      let err = new Error('Current number of registered storage is zero. Must register a storage first.')
      err.code = 'ENXIO'
      throw err
    }

    let dest = undefined
    // get dest by custom middleware
    storage_list = await m_policy.extensionType(db, key, io_params, fuse_params, storage_list)

    // last policy: random policy
    dest = await random_policy(db, key, io_params, fuse_params, storage_list)
    debug('getObjDest:', dest)

    if(dest) {
      return dest
    } else {
      let err = new Error('No candidate storage.')
      err.code = 'ENXIO'
      throw err
    }

  } catch(err) {
    debug('getObjDest_error', err.stack)
    throw err
  }
}
