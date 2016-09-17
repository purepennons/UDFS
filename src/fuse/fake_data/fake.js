"use strict"

const fs = require('fs-extra')
const path = require('path')
const octal = require('octal')
const SecureDB = require('../../secure_db/index')

// db setup
const db_path = '/data/db/leveldb'

// clear
fs.removeSync(db_path)
fs.mkdirpSync(db_path)

let db = new SecureDB(db_path)
const fm_ops = require('../../secure_db/operations/file_metadata_ops')(db.fileMetadata)

const ROOT = {
	type: 'directory',
	mode: octal(40755),
	size: 4096,
  uid: process.getuid(),
  gid: process.getgid()
}

const folder = {
  uid: process.getuid(),
  gid: process.getgid(),
  mode: octal(40755),
  size: 4096,
  type: 'directory',
  status: true,
  file_id: '1234567890'
}

const file = {
  uid: process.getuid(),
  gid: process.getgid(),
  mode: octal(100755),
  size: 65537,
  type: 'file',
  status: true,
  file_id: '1234567891'
}

let cb = function(err, key) {
  if(err) return console.log(err)
  return console.log(key)
}

fm_ops.put('/test', folder, (err, key) => {
  fm_ops.put('/test/1.txt', file, cb)
  fm_ops.put('/test/2.txt', file, cb)
  fm_ops.put('/test/3.txt', file, cb)
})
fm_ops.put('/a.txt', file, cb)
fm_ops.put('/b.txt', file, cb)
fm_ops.put('/c.txt', file, cb)
