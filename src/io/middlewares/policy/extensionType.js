"use strict"

const debug = require('debug')('fuse-io#middleware#policy#extensionType')
const path = require('path')

// always return the filtered storage_list
module.exports = async (ops) => {

  let db = ops.db
  let key = ops.key
  let io_params = ops.io_params
  let fuse_params = ops.fuse_params
  let storage_list = ops.storage_list

  try {
    let extension = path.extname(key).toLowerCase()
    if(!extension) return ops

    let filtered_list = storage_list
    if(storage_list.length > 1) {
      filtered_list = storage_list
      .filter(s_info => {
        let otherInfo = s_info.value.otherInfo
        if(otherInfo.policy && otherInfo.policy.extensionType) {
          // check the exension is matched in extensionType array or not
          let hit = otherInfo.policy.extensionType
          .map(type => type.toLowerCase())
          .indexOf(extension)
          return (hit > -1)? true: false
        }
        return false
      })
    }

    // if create zero candidate in the policy, just return whole storage list (storage_list)
    if(filtered_list.length > 0) ops.storage_list = filtered_list

  } catch(err) {
    // if catch a err, just return the whole storage list
    debug('err', err.stack)
  }
  
  return ops
}
