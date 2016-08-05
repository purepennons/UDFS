"use strict"

const test = require('tape')
const util = require('util')
const fs = require('fs-extra')
const octal = require('octal')
const Promise = require('bluebird')

const levelup = require('levelup')

const file_metadata_ops = require('../../secure_db/operations/file_metadata_ops')
const stat = require('../../lib/stat')
const lib = require('../../lib/lib')

const db_path = '/tmp/leveldb/testing/file_metadata_ops'


// setup
fs.removeSync(db_path)
fs.mkdirpSync(db_path)

let db = levelup(db_path)
let ops = file_metadata_ops(db)

// promisify
ops.getAsync = Promise.promisify(ops.get)
ops.putAsync = Promise.promisify(ops.put)

const root = '/'
const notExist = '/notExist'
const parent_folder_path = '/a'
const folder_path = '/a/b'
const file_path = '/a/b/file'
const parentNotFolder = '/a/b/file/GG'

const ROOT = lib.metaWrapper({
	type: 'directory',
	mode: octal(777),
	size: 4096
})

const folder = lib.metaWrapper({
  uid: 1000,
  gid: 1000,
  mode: octal(777),
  size: 4096,
  type: 'directory',
  status: true,
  file_id: '1234567890'
})

const file = lib.metaWrapper({
  uid: 1000,
  gid: 1000,
  mode: octal(777),
  size: 4096,
  type: 'file',
  status: true,
  file_id: '1234567891'
})

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

		// create "/a" folder again
		ops.put(parent_folder_path, folder, (err, key) => {
			assert.equal(err.code, 'EEXIST', `path ${key} exist. Recreate failed.`)
		})

    ops.getStat(key, (err, s, k) => {
      assert.equal(err, null, `key = ${k}, stat = ${util.inspect(s, false, null)}`)
      assert.equal(s.type, 'directory', `path ${key} is a directory.`)

      // create /a/b folder
      ops.put(folder_path, folder, (err, key) => {
        assert.equal(err, null, `key = ${key}`)
        ops.getStat(key, (err, s, k) => {
          assert.equal(err, null, `key = ${k}, stat = ${util.inspect(s, false, null)}`)
          assert.equal(s.type, 'directory', `path ${key} is a directory.`)

          // create a file
          ops.put(file_path, file, (err, key) => {
            assert.equal(err, null, `key = ${key}`)
            ops.getStat(key, (err, s, k) => {
              assert.equal(err, null, `key = ${k}, stat = ${util.inspect(s, false, null)}`)
              assert.equal(s.type, 'file', `path ${key} is a file.`)

              // the parent is not a directory
              ops.put(parentNotFolder, file, (err, key) => {
                assert.equal(err.code, 'ENOTDIR', `path ${key} is not a directory`)
              })

							// update the file
							let update_data = {
								stat: {
									uid: 1111,
									gid: 1111
								},
								addInfo: {
									a: 10,
									b: 20
								}
							}
							ops.update(file_path, update_data, (err, key) => {
								assert.equal(err, null, `key = ${key}, update a file success`)
								ops.get(file_path, (err, file, k) => {
									let expect = {
										stat: {
										  uid: 1111,
										  gid: 1111,
										  mode: octal(777),
										  size: 4096,
										  type: 'file',
										  status: true,
										  file_id: '1234567891'
										},
										addInfo: {
											a: 10,
											b: 20
										}
									}
									assert.equal(err, null, 'a file has been updated without error')
									assert.deepEqual(file, expect, 'updated result is correct.')
								})
							})
            })
          })
        })
      })
    })
  })
  assert.end()
})

// get list
test('get file list from a folder', assert => {
  const emptyParent = '/empty'
  const parent = '/list'
  const fileList = ['a', 'b', 'c', 'd', 'directory']

  // setup
  // empty folder
  ops.putAsync(emptyParent, folder)
  .then(key => {
    // get a list from an empty folder
    ops.getList(emptyParent, (err, files) => {
      assert.same(files, [], 'The filenames from path "/empty" are all correct')
    })
  })
  .catch(err => {
    assert.error(err, 'Setup failed')
  })

  // list
  // create a folder named list
  ops.putAsync(parent, folder)
  .then(key => {
    return Promise.map(fileList, file => {
      if(file === 'directory') return ops.putAsync(`${parent}/${file}`, folder)
      return ops.putAsync(`${parent}/${file}`, file)
    })
  })
  .then(key => {
    // get a list from "list" folder
    ops.getList(parent, (err, files) => {
      assert.same(files, fileList, 'The filenames from path "/list" are all correct')
    })
  })
  .catch(err => {
    assert.error(err, 'Setup failed')
  })

  assert.end()
})
