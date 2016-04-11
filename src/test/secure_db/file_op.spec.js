"use strict"

const test = require('tape')
const fs = require('fs-extra')
const octal = require('octal')

const levelup = require('levelup')

const file_ops = require('../../secure_db/operations/file_op')

const db_path = '/tmp/leveldb/testing/file_op'

// setup
fs.removeSync(db_path)
fs.mkdirpSync(db_path)

let db = levelup(db_path)
let ops = file_ops(db)

const root = '/'
const notExist = '/notExist'
const folder_path = '/a/b/c'
const file_path = '/a/b/c/file.txt'

const folder = {
  uid: 1000,
  gid: 1000,
  mode: octal(777),
  size: 4096,
  type: 'directory',
  status: true,
  file_id: '1234567890'
}

test('create a new file or directory', assert => {
  // root
  // ops.put(root, {}, err => {
  //   assert.equal(err.code, 'EPERM', 'Operation not permitted')
  // })
  //
  // // parent folder is not exist.
  // ops.put(file_path, {}, err => {
  //   assert.equal(err.code, 'ENOENT', 'Not a directory')
  // })
  //
  // ops.put(folder_path, folder, (err, key) => {
  //   console.log(key);
  // })



  assert.end()
})

test('get a file metadata', assert => {

  // root
  ops.get(root, (err, file) => {
    if(!err) assert.ok(file)
  })

  // non-exist file
  ops.get(notExist, (err, file) => {
    assert.equal(err.code, 'ENOENT', 'get non-exist file')
  })
  assert.end()
})
