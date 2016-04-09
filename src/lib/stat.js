"use strict"

class Stat {

  // define the metadata of basic file
  constructor(stat) {
    // basic stat
    this.uid = stat.uid || 0
  	this.gid = stat.gid || 0
  	this.mode = stat.mode || 0
  	this.size = stat.size || 0
  	this.mtime = toDate(stat.mtime)
  	this.atime = toDate(stat.atime)
  	this.ctime = toDate(stat.ctime)
    this.birthtime = toDate(stat.birthtime)

    this.ino = stat.ino // not used
    this.blksize = stat.blksize // not used
    this.dev = stat.dev // not used
    this.nlink = stat.nlink // not used
    this.rdev = stat.rdev // not used
    this.blocks = stat.blocks // not used

    // custom stat
  	this.type = stat.type // file or directory
    this.status = stat.status || true // set true when the file is allowed to access

    this.blob = stat.blob  // not used, save binary
  }


}

function toDate(date) {
  if(!date) return new Date()
  if(typeof date === 'string') return new Date(date)
  return date
}

module.exports = function(stat) {
  return new Stat(stat)
}
