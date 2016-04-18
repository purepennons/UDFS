"use strict"

const test = require('tape')
const util = require('util')
const fs = require('fs-extra')
const octal = require('octal')

const levelup = require('levelup')

const file_ops = require('../../secure_db/operations/file_op')
const stat = require('../../lib/stat')

const db_path = '/tmp/leveldb/testing/file_op'

// setup
fs.removeSync(db_path)
fs.mkdirpSync(db_path)

let db = levelup(db_path)
let ops = file_ops(db)

const root = '/'
const notExist = '/notExist'
const parent_folder_path = '/a'
const folder_path = '/a/b'
const file_path = '/a/b/file'
const parentNotFolder = '/a/b/file/GG'

const ROOT = {
	type: 'directory',
	mode: octal(777),
	size: 4096
}

const folder = {
  uid: 1000,
  gid: 1000,
  mode: octal(777),
  size: 4096,
  type: 'directory',
  status: true,
  file_id: '1234567890'
}

const file = {
  uid: 1000,
  gid: 1000,
  mode: octal(777),
  size: 4096,
  type: 'file',
  status: true,
  file_id: '1234567891'
}

// ops.get
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

// ops.put
test('create a new file or directory', assert => {
  // root
  ops.put(root, ROOT, err => {
    assert.equal(err.code, 'EPERM', 'Operation not permitted')
  })

  // parent folder "/a" is not exist.
  ops.put(folder_path, folder, (err, key) => {
    assert.equal(err.code, 'ENOENT', 'No such file or directory')
  })

  // create folder and a file
  // create "/a" folder
  ops.put(parent_folder_path, folder, (err, key) => {
    assert.equal(err, null, `key = ${key}`)
    ops.get(key, (err, s, k) => {
      assert.equal(err, null, `key = ${k}, stat = ${util.inspect(s, false, null)}`)
      assert.equal(s.type, 'directory', `path ${key} is a directory.`)

      // create /a/b folder
      ops.put(folder_path, folder, (err, key) => {
        assert.equal(err, null, `key = ${key}`)
        ops.get(key, (err, s, k) => {
          assert.equal(err, null, `key = ${k}, stat = ${util.inspect(s, false, null)}`)
          assert.equal(s.type, 'directory', `path ${key} is a directory.`)

          // create a file
          ops.put(file_path, file, (err, key) => {
            assert.equal(err, null, `key = ${key}`)
            ops.get(key, (err, s, k) => {
              assert.equal(err, null, `key = ${k}, stat = ${util.inspect(s, false, null)}`)
              assert.equal(s.type, 'file', `path ${key} is a file.`)

              // the parent is not a directory
              ops.put(parentNotFolder, file, (err, key) => {
                assert.equal(err.code, 'ENOTDIR', `path ${key} is not a directory`)
              })
            })
          })
        })
      })
    })
  })



  assert.end()
})
