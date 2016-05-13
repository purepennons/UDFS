"use strict"

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
  console.log('bad_url', bad_url)
  req.post(bad_url, (err, res, body) => {
    assert.error(err, 'Create a meta data without errors')
    assert.equal(res.statusCode, 403, 'creating a meta data of the file failed because without a file system.')
    console.log('body', body)
  })

  let url = [root_url, fs_id, '/meta', '/create'].join('')
  console.log('url', url)
  req.post(url, (err, res, body) => {
    assert.error(err, 'Create a meta data without errors')
    assert.equal(res.statusCode, 201, 'creating a meta data of the file success.')
    console.log('body', body)
  })

  assert.end()
})
