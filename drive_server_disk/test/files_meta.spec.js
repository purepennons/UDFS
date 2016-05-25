"use strict"

const debug = require('debug')('test:files_meta')
const test = require('tape')
const req = require('request')
const path = require('path')

const host = 'http://localhost:3000'

// storage
const fs_id = '9a4a5870-1915-11e6-8eb1-873616bc0784'
const root_url = [host, '/storage/v1/'].join('')

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
    })
  })

  assert.end()
})
