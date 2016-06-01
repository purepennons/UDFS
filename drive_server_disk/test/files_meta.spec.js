"use strict"

const debug = require('debug')('test:files_meta')
const test = require('tape')
const req = require('request')
const path = require('path')

const host = 'http://localhost:3000'

// storage
const fs_id = 'f9897650-27dd-11e6-a489-b36c34b5dedb'
const root_url = [host, '/storage/v1/'].join('')
// 404
const notFoundUrl = [root_url, fs_id, '/meta', '/notFound'].join('')

test('create a new metadata of the file', assert => {

  // create a file without a file system
  let bad_url = [root_url, 'nofs/meta', '/create'].join('')
  debug('bad_url', bad_url)
  req.post(bad_url, (err, res, body) => {
    assert.error(err, 'Create a meta data without errors')
    assert.equal(res.statusCode, 403, 'creating a meta data of the file failed because without a file system.')
    debug('body', body)
  })

  // create a file without assigning the metadata
  let url = [root_url, fs_id, '/meta', '/create'].join('')
  debug('url', url)
  req.post(url, (err, res, body) => {
    assert.error(err, 'Create a meta data without errors')
    assert.equal(res.statusCode, 201, 'creating a meta data of the file success.')
    debug('body', body)
  })

  // create a file with metadata
  let stat = {
      "dev": 16777220,
      "mode": 33188,
      "nlink": 1,
      "uid": 501,
      "gid": 20,
      "rdev": 0,
      "blksize": 4096,
      "ino": 120898427,
      "size": 0,
      "blocks": 0,
      "atime": "2016-05-25T09:21:54.000Z",
      "mtime": "2016-05-25T09:21:54.000Z",
      "ctime": "2016-05-25T09:21:54.000Z",
      "birthtime": "2016-05-25T09:21:54.000Z"
  }

  let meta = JSON.stringify({
    stat,
    otherInfo: {a:10, b:20}
  })
  debug(meta);
  req.post({
    url,
    headers: {
      'content-type' : 'application/x-www-form-urlencoded'
    },
    body: `meta=${meta}`
  }, (err, res, body) => {
    assert.error(err, 'Create a meta data without errors')
    assert.equal(res.statusCode, 201, 'creating a meta data of the file success.')
    debug('body', body)
  })

  assert.end()
})

test('get a metadata from a file', assert => {

  // GET 404
  req.get(notFoundUrl, (err, res, body) => {
    assert.error(err, `get metadata without errors (404)`)
    assert.equal(res.statusCode, 404, `Metadata not found`)
  })

  let createUrl = [root_url, fs_id, '/meta', '/create'].join('')

  // get a metadata from the file which is without metadata when creating
  req.post(createUrl, (err, res, body) => {
    body = JSON.parse(body)
    let data = body.data[0]
    let meta_id = data.meta_id

    // get meta
    let getUrl = [root_url, fs_id, '/meta', `/${meta_id}`].join('')
    req.get(getUrl, (err, res, body) => {
      let bodyObj = JSON.parse(body)

      assert.error(err, `get a metadata from ${meta_id} object without error`)
      assert.equal(res.statusCode, 200, `get a metadata from ${meta_id} object success`)
      assert.ok(bodyObj.data[0].meta.stat, 'Get the stat from metadata')

      debug('body', body)
    })
  })

  // get a metadata from the file which is with metadata when creating
  let stat = {
      "dev": 16777220,
      "mode": 33188,
      "nlink": 1,
      "uid": 501,
      "gid": 20,
      "rdev": 0,
      "blksize": 4096,
      "ino": 120898427,
      "size": 0,
      "blocks": 0,
      "atime": "2016-05-25T09:21:54.000Z",
      "mtime": "2016-05-25T09:21:54.000Z",
      "ctime": "2016-05-25T09:21:54.000Z",
      "birthtime": "2016-05-25T09:21:54.000Z"
  }

  let meta = JSON.stringify({
    stat,
    otherInfo: {a:10, b:20}
  })
  req.post({
    url: createUrl,
    headers: {
      'content-type' : 'application/x-www-form-urlencoded'
    },
    body: `meta=${meta}`
  }, (err, res, body) => {
    body = JSON.parse(body)
    let data = body.data[0]
    let meta_id = data.meta_id

    // get meta
    let getUrl = [root_url, fs_id, '/meta', `/${meta_id}`].join('')
    req.get(getUrl, (err, res, body) => {
      let bodyObj = JSON.parse(body)

      assert.error(err, `get a metadata from ${meta_id} object without error`)
      assert.equal(res.statusCode, 200, `get a metadata from ${meta_id} object success`)
      assert.ok(bodyObj.data[0].meta.stat, 'Get the stat from metadata')
      assert.deepEqual(bodyObj.data[0].meta.otherInfo, {a:10, b:20}, 'Get the stat from metadata')

      debug('body', body)

      // test the update operation
      let updateData = JSON.stringify({
        otherInfo: {a:20, c:30}
      })

      // PUT 404
      req.put(notFoundUrl, (err, res, body) => {
        assert.error(err, `Update a non-exist object's metadata without errors (404)`)
        assert.equal(res.statusCode, 404, `Metadata not found`)
      })

      let putUrl = [root_url, fs_id, '/meta', `/${meta_id}`].join('')
      req.put({
        url: putUrl,
        headers: {
          'content-type' : 'application/x-www-form-urlencoded'
        },
        body: `meta=${updateData}`
      }, (err, res, body) => {
        let bodyObj = JSON.parse(body)

        assert.error(err, `update a metadata from ${meta_id} object without error`)
        assert.equal(res.statusCode, 200, `update a metadata from ${meta_id} object success`)
        assert.deepEqual(bodyObj.data[0].meta.otherInfo, {a:20, b:20, c:30}, 'update otherInfo of metadata')

        // update without metadata
        req.put(putUrl, (err, res, body) => {
          assert.error(err, `update a metadata from ${meta_id} object without error`)
          assert.equal(res.statusCode, 204, `update a metadata from ${meta_id} object success`)

          // delete the metadata
          let deleteUrl = [root_url, fs_id, '/meta', `/${meta_id}`].join('')
          req.delete(deleteUrl, (err, res, body) => {
            assert.error(err, `delete a metadata without errors`)
            assert.equal(res.statusCode, 204, `delete a metadata success`)

            // delete more times will response 404
            req.delete(deleteUrl, (err, res, body) => {
              assert.error(err, `delete a not found metadata without errors`)
              assert.equal(res.statusCode, 404, `the metadata is not found`)

            // check the metadata is exists or not
            req.get(getUrl, (err, res, body) => {
                assert.equal(res.statusCode, 404, `the metadata is not found`)
              })
            })

          })
        })
      })

    })
  })

  assert.end()
})
