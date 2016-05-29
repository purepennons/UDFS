"use strict"

const debug = require('debug')('test:files')
const test = require('tape')
const req = require('request')
const path = require('path')
const FormData = require('form-data')
const http = require('http')
const fs = require('fs-extra')
const unireq = require('unirest')

const host = 'http://localhost:3000'

// storage
const root_url = [host, '/storage/v1/'].join('')

const CRLF = '\r\n'

function setup(cb) {
  req.post([root_url, 'create'].join(''), (err, res, body) => {
    body = JSON.parse(body)
    let fs_id = body.data[0].fs_id
    req.post([root_url, fs_id, '/meta', '/create'].join(''), (err, res, body) => {
      body = JSON.parse(body)
      let meta_id = body.data[0].meta_id
      let object_id = body.data[0].object_id
      let object_url = body.data[0].object_url

      // do something after the setup
      return cb(fs_id, meta_id, object_id, object_url)
    })
  })
}

function clear(fs_id, meta_id, object_id, object_url) {
  req.delete([root_url, fs_id, '/meta', `/${meta_id}`].join(''), (err, res, body) => {
    console.log('clear the test')
  })
}

test('upload a file', assert => {
  setup((fs_id, meta_id, object_id, object_url) => {
    debug('setup', fs_id, meta_id, object_id, object_url)

    let req_stream = req.put([root_url, fs_id, '/files', `/${object_id}`].join(''))
    req_stream.setHeader('Content-Range', 'bytes 2-123/123')

    let form = req_stream.form()
    form.append('file', fs.createReadStream('/Users/PureWind/Documents/githubProject/thesis/drive_server_disk/app.js'))
    form.getLength((err, len) => {
      req_stream.setHeader('Content-Length', len)
    })

    req_stream.on('response', res => {
      console.log(res.statusCode)
    })

    // let form_ops = {}
    //
    // form.append('filename', 'test_value')
    // form.append('filename2', 'test_value')
    // form.append('filename3', 'test_value')
    //
    // let headers = {
    //   'content-type': form.getHeaders(),
    //   'content-length': 123
    // }
    //
    // let req_stream = http.request({
    //   method: 'put',
    //   port: 3000,
    //   host: 'localhost',
    //   path: ['/storage/v1/', fs_id, '/files/', object_id].join(''),
    //   headers: headers
    // })
    //
    // req_stream.on('error', err => console.error(err.stack))
    // form.pipe(req_stream)
    //
    // req_stream.on('response', res => {
    //   console.log(res.statusCode)
    // })

    clear(fs_id, meta_id, object_id, object_url)
  })
  assert.end()
})
