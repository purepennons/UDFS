"use strict"

const test = require('tape')
const req = require('request')
const path = require('path')

const host = 'http://localhost:3000'

// storage
const root_url = [host, '/storage/v1'].join('')
test('create a file system', assert => {
  let url = [root_url, '/create'].join('')
  req.post(url, (err, res, body) => {
    assert.error(err, 'creating a file system bucket without errors.')
    assert.equal(res.statusCode, 201, 'creating a file system bucket success.')
  })
  assert.end()
})
