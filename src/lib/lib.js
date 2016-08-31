"use strict"

const _ = require('lodash')
const uuid = require('node-uuid')
const xtend = require('xtend')

exports.parseFlag = function(flag) {
  switch(flag & 3) {
    case 0:
      return 'r'  // O_RDONLY, 32768 = 0100000
    case 1:
      return 'w'  // O_WRONLY, 32769 = 0100001
    default:
      return 'r+' // O_RDWR, 32770 = 0100002, w+?
  }
}

// from node source code: https://github.com/nodejs/node/blob/a0579c0dc79aa8fab56638844f233b821a51b9e9/lib/fs.js#L552
function stringToFlags(flag) {
  // Return early if it's a number
  if (typeof flag === 'number') {
    return flag;
  }

  switch (flag) {
    case 'r' : return O_RDONLY;
    case 'rs' : // fall through
    case 'sr' : return O_RDONLY | O_SYNC;
    case 'r+' : return O_RDWR;
    case 'rs+' : // fall through
    case 'sr+' : return O_RDWR | O_SYNC;

    case 'w' : return O_TRUNC | O_CREAT | O_WRONLY;
    case 'wx' : // fall through
    case 'xw' : return O_TRUNC | O_CREAT | O_WRONLY | O_EXCL;

    case 'w+' : return O_TRUNC | O_CREAT | O_RDWR;
    case 'wx+': // fall through
    case 'xw+': return O_TRUNC | O_CREAT | O_RDWR | O_EXCL;

    case 'a' : return O_APPEND | O_CREAT | O_WRONLY;
    case 'ax' : // fall through
    case 'xa' : return O_APPEND | O_CREAT | O_WRONLY | O_EXCL;

    case 'a+' : return O_APPEND | O_CREAT | O_RDWR;
    case 'ax+': // fall through
    case 'xa+': return O_APPEND | O_CREAT | O_RDWR | O_EXCL;
  }

  throw new Error('Unknown file open flag: ' + flag);
}

// pre-process the stat of file before inserting
// especially generates the file_id, uid, gid if they do not exist.
// Also updates the atime
// It will set the status to false if without the status of options
exports.statWrapper = function(s, status=false, options={atimeUpdate: true, mtimeUpdate: false}) {
  if(!s) throw new Error('without the stat param')

  // options pre-process
  if(!(_.has(options, 'atimeUpdate'))) options.atimeUpdate = true

  // must check
  s.file_id = s.file_id || uuid.v1() // timestamp-based uuid
  s.uid = s.uid || process.getuid()
  s.gid = s.gid || process.getgid()

  // update
  s.status = status
  if(options.atimeUpdate) s.atime = new Date()
  if(options.mtimeUpdate) s.mtime = new Date()

  return s
}

exports.metaWrapper = function(stat) {
  return {
    meta: {
      stat
    }
  }
}

// return a file info template
exports.fileInfoWrapper = function(fileInfo) {
  fileInfo.chunk_list = fileInfo.chunk_list || []
  fileInfo.num_of_chunk = fileInfo.chunk_list.length
  fileInfo.total_size = fileInfo.total_size || 0
}

exports.fileMetaWrapper = function(origin, extend) {
  const must_props = ['file_id', 'meta', 'object_info']

  if(!origin) origin = {}
  let update_obj = xtend(origin, extend)

  // 補足不齊的屬性，並初始化
  update_obj['file_id'] = update_obj['file_id'] || ''
  update_obj['meta'] = update_obj['meta'] || 1
  update_obj['object_info'] = update_obj['object_info'] || ''

  // delete redundant props
  _
  .xor(Object.keys(update_obj), must_props)
  .forEach(prop => delete update_obj[prop])

  return update_obj

}

exports.objectWrapper = function(origin, extend) {
  const must_props = ['etag', 'version', 'storage_id', 'meta_id', 'object_id', 'object_url', 'start', 'end', 'size']

  if(!origin) origin = {}
  let update_obj = xtend(origin, extend)

  // 補足不齊的屬性，並初始化
  update_obj['etag'] = update_obj['etag'] || ''
  update_obj['version'] = update_obj['version'] || 1
  update_obj['storage_id'] = update_obj['storage_id'] || ''
  update_obj['meta_id'] = update_obj['meta_id'] || ''
  update_obj['object_id'] = update_obj['object_id'] || ''
  update_obj['object_url'] = update_obj['object_url'] || ''
  update_obj['start'] = update_obj['start'] || 0
  update_obj['end'] = update_obj['end'] || 0
  update_obj['size'] = update_obj['size'] || 0

  // delete redundant props
  _
  .xor(Object.keys(update_obj), must_props)
  .forEach(prop => delete update_obj[prop])

  return update_obj
}

exports.chunkWrapper = function(origin, extend) {
  const must_props = ['chunk_order', 'read', 'write', 'chunk_size', 'current_size']

  if(!origin) origin = {}
  let update_obj = xtend(origin, extend)

  // 補足不齊的屬性，並初始化
  update_obj['chunk_order'] = update_obj['chunk_order'] || -1
  update_obj['read'] = update_obj['read'] || []
  update_obj['write'] = update_obj['write'] || []
  update_obj['chunk_size'] = update_obj['chunk_size'] || 0
  update_obj['current_size'] = update_obj['current_size'] || 0

  // delete redundant props
  _
  .xor(Object.keys(update_obj), must_props)
  .forEach(prop => delete update_obj[prop])

  return update_obj
}

exports.isSameSrc = function(obj1, obj2) {
  return (obj1.storage_id === obj2.storage_id) & (obj1.object_id === obj2.object_id)
}

function genUniqueKeyFromMap(m, start=0, range=65535) {
  if(!m) throw new Error('Without a map param')
  if(start+1 <= 65536 && !m.has(start+1)) return start + 1

  // need to generate a random number for file descriptor
  start = _.random(1, start-1)

  return genUniqueKeyFromMap(m, start, range)
}
exports.genUniqueKeyFromMap = genUniqueKeyFromMap
