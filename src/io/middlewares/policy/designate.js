const debug = require('debug')('fuse-io#middleware#policy#designate')
const path = require('path')
const Bluebird = require('bluebird')

const n = require('../../../lib/path')


const getAllParentDir = (dir, cb) => {
  let pdir_arr = []

  function loop(pdir) {
    pdir_arr.unshift(pdir)
    if(pdir !== '/'){
      return process.nextTick( loop.bind(null, path.dirname(pdir)) )
    } else {
      return process.nextTick(cb.bind(null, null, pdir_arr))
    }
  }

  loop(dir)
}
const getAllParentDirAsync = Bluebird.promisify(getAllParentDir)

// always return the filtered storage_list
module.exports = async (db, key, io_params, fuse_params, storage_list) => {
  // if storage_list.length = 0 or storage_list.length = 1, just return the whole storage_list
  if(storage_list.length < 2) return storage_list

  try {
    key = n.normalize(key)
    let pdir_arr = await getAllParentDirAsync(path.dirname(key))

    let filtered_list = storage_list

    filtered_list = storage_list
    .filter(s_info => {
      let otherInfo = s_info.value.otherInfo
      if(otherInfo.policy && otherInfo.policy.designate) {
        // check the pdir_arr is matched in designate array or not
        let hit = otherInfo.policy.designate
        .reduce((prev, cur, cur_idx, arr) => {
          if(prev) return true  // quick condition, for speed up
          if(pdir_arr.indexOf(cur) < 0) {
            // return prev | false
            return false
          } else {
            // return prev | true
            return true
          }
        }, false)

        return hit
      }

      return false
    })

    // if create zero candidate in the policy, just return whole storage list (storage_list)
    if(filtered_list.length > 0) return filtered_list
    return storage_list

  } catch(err) {
    // if catch a err, just return the whole storage list
    return storage_list
  }
}
