"use strict"

const debug = require('debug')('test:files')
const test = require('tape')
const req = require('request')
const path = require('path')
const FormData = require('form-data')
const http = require('http')
const fs = require('fs-extra')
const unireq = require('unirest')
// const contenRange = require('content-range')

const host = 'http://localhost:3000'

// storage
const root_url = [host, '/storage/v1/'].join('')
const dummy_path = path.resolve(path.join(__dirname, './dummy/fakeFileToUpload.txt'))

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
  // req.delete([root_url, fs_id, '/meta', `/${meta_id}`].join(''), (err, res, body) => {
  //   console.log('clear the test')
  // })
}

test('upload a file', assert => {
  setup((fs_id, meta_id, object_id, object_url) => {
    debug('setup', fs_id, meta_id, object_id, object_url)

    // full update, offset = 0
    let stat = fs.statSync(dummy_path)

    // real request
    let req_stream = req.put({
      url: [root_url, fs_id, '/files', `/${object_id}`].join(''),
      headers: {
        'range': 'bytes=0-',
      },
      formData: {
        'file': fs.createReadStream(dummy_path)
      }
    })

    // response
    req_stream.on('response', res => {
      assert.equal(res.statusCode, 200, 'upload full content success')

      // update a object from offset 10
      let offset_req_stream = req.put({
        url: [root_url, fs_id, '/files', `/${object_id}`].join(''),
        headers: {
          'range': 'bytes=10-',
        },
        formData: {
          'file': fs.createReadStream(dummy_path)
        }
      })

      offset_req_stream.on('response', res => {
        assert.equal(res.statusCode, 200, 'upload partial content success')

        clear(fs_id, meta_id, object_id, object_url)
      })

    })
  })

  // advance form example
  // NOTE: Advanced use-case, for normal use see 'formData' usage above
  // var r = request.post('http://service.com/upload', function optionalCallback(err, httpResponse, body) {...})
  // var form = r.form();
  // form.append('my_field', 'my_value');
  // form.append('my_buffer', new Buffer([1, 2, 3]));
  // form.append('custom_file', fs.createReadStream(__dirname + '/unicycle.jpg'), {filename: 'unicycle.jpg'});


  assert.end()
})
