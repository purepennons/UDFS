"use strict"

const _ = require('lodash')
const uuid = require('node-uuid')

exports.parseFlag = function(flag) {
  switch(flag & 3) {
    case 0:
      return 'r'  // O_RDONLY, 32768 = 0100000
    case 1:
      return 'w'  // O_WRONLY, 32769 = 0100001
    case 2:
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

  return s
}

// return a file info template
exports.fileInfoWrapper = function(fileInfo) {
  fileInfo.chunk_list = fileInfo.chunk_list || []
  fileInfo.num_of_chunk = fileInfo.chunk_list.length
  fileInfo.total_size = fileInfo.total_size || 0
}

function genUniqueKeyFromMap(m, start=0, range=65535) {
  if(!m) throw new Error('Without a map param')
  if(start+1 <= 65536 && !m.has(start+1)) return start + 1

  // need to generate a random number for file descriptor
  start = _.random(1, start-1)

  return genUniqueKeyFromMap(m, start, range)
}
exports.genUniqueKeyFromMap = genUniqueKeyFromMap
