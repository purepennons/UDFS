const debug = require('debug')('fuse-io#middleware#policy#extensionType')
const path = require('path')

// always return the filtered storage_list
module.exports = async (db, key, io_params, fuse_params, storage_list) => {
  try {
    let extension = path.extname(key).toLowerCase()
    if(!extension) return storage_list

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
    if(filtered_list.length > 0) return filtered_list
    return storage_list

  } catch(err) {
    // if catch a err, just return the whole storage list
    return storage_list
  }
}
