"use strict"

// const
const TEMP_STORAGE_ID = 'storage_id'
const TEMP_FS_ID = '70642310-3134-11e6-9e2f-3ffeaedf456b'

/*
 * destination define
 * @param {object} ops - pass all options needed
 * @return {string} storage info
 */
exports.getMetaDest = function(ops) {
  /*
   * TODO: choosing the storage which registered
   */

  // just return a default storage
  return {
    storage_id: TEMP_STORAGE_ID,
    fs_id: TEMP_FS_ID,
    protocol: 'http',
    host: 'localhost',
    port: 3000,
    hostname: 'http://localhost:3000'
  }
}
