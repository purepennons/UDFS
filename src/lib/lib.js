"use strict"

const _ = require('lodash')
const uuid = require('node-uuid')

exports.parseFlag = function(flag) {
  switch(flag) {
    case 0:
      return 'r'
    case 1:
      return 'w'
    case 2:
      return 'r+'
  }
}

// pre-process the stat of file before inserting
// especially generates the file_id, uid, gid if they do not exist.
// Also updates the atime
// It will set the status to false if without the status of options
exports.statWrapper = function(s, status=false, options={atimeUpdate: true}) {
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

  return s
}

function genUniqueKeyFromMap(m, start=0, range=65535) {
  if(!m) throw new Error('Without a map param')
  if(start+1 <= 65536 && !m.has(start+1)) return start + 1

  // need to generate a random number for file descriptor
  start = _.random(1, start-1)

  return genUniqueKeyFromMap(m, start, range)
}
exports.genUniqueKeyFromMap = genUniqueKeyFromMap
