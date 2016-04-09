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

test('get a file metadata', assert => {
  const root = '/'
  const notExist = '/notExist'
  const folder = '/a/b/c'
  const file = '/a/b/c/file.txt'

  // root
  ops.get(notExist, (err, file) => {
    assert.equal(err.code, 'ENOENT', 'get non-exist file')
  })
  assert.end()
})
