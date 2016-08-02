const debug = require('debug')('fuse-io-requests')
const fs = require('fs-extra')
const url = require('url')
const req = require('request')
const http = require('http')
const Promise = require('bluebird')
const HTTPCode= require('http-status-codes')

// other define
const P_Req = function(ops) {
  return new Promise((resolve, reject) => {
    http.request(ops, res => {
      return resolve(res)
    }).on('error', err => {
      reject(err)
    }).end()
  })
}

// error code
const BAD_CODE = new Error('bad http code')
BAD_CODE.code = 'EREMOTEIO'
const OP_ERROR = new Error('operation fail')
OP_ERROR.code = 'EREMOTEIO'

// define all apis of driver
// const apiVersion = 'v1'

const root_path = '/storage/v1/'
// fs
let FileSystem = {}
// create
FileSystem.create = function(host) {
  const url = [host, root_path, '/create'].join('')
  return new Promise((resolve, reject) => {
    req.post(url, (err, res, body) => {
      if(err) return reject(err)
      return resolve(res)
    })
  })
}

// file meta
let FileMeta = {}

// create

/*
 *
 * @param {object} meta - must contain a stat property
 * @return {object} data of http body
 */
FileMeta.create = function(host, fs_id, meta) {
  const url = [host, root_path, fs_id, '/meta', '/create'].join('')
  return new Promise((resolve, reject) => {
    try {
      meta = JSON.stringify(meta)
      req.post({
        url,
        headers: {
          'content-type' : 'application/x-www-form-urlencoded'
        },
        body: `meta=${meta}`
      }, (err, res, body) => {
        if(err) return reject(err)
        if(res.statusCode !== HTTPCode.CREATED) return reject(BAD_CODE)
        body = JSON.parse(body)
        if(body.status === 'error') return reject(OP_ERROR)
        return resolve(body.data[0])
      })
    } catch(err) {
      return reject(err)
    }
  })
}

// get
FileMeta.get = function(host, fs_id, meta_id) {
  const url = [host, root_path, fs_id, '/meta', `/${meta_id}`].join('')
  return new Promise((resolve, reject) => {
    req.get(url, (err, res, body) => {
      if(err) return reject(err)
      if(res.statusCode !== HTTPCode.OK) return reject(BAD_CODE)
      return resolve(JSON.parse(body))
    })
  })
}

// update
/*
 * @param {object} updateMeta - only put the properties that need to be updated
 */
FileMeta.update = function(host, fs_id, meta_id, updateMeta) {
  const url = [host, root_path, fs_id, '/meta', `/${meta_id}`].join('')
  return new Promise((resolve, reject) => {
    try {
      updateMeta = JSON.stringify(updateMeta)
      req.put({
        url,
        headers: {
          'content-type' : 'application/x-www-form-urlencoded'
        },
        body: `meta=${updateMeta}`
      }, (err, res, body) => {
        if(err) return reject(err)
        if(res.statusCode === HTTPCode.OK || res.statusCode === HTTPCode.NOT_MODIFIED) return resolve(JSON.parse(body))
        return reject(BAD_CODE)
      })
    } catch(err) {
      return reject(err)
    }
  })
}

// delete
FileMeta.del = function(host, fs_id, meta_id) {
  const url = [host, root_path, fs_id, '/meta', `/${meta_id}`].join('')
  return new Promise((resolve, reject) => {
    req.delete(url, (err, res, body) => {
      if(err) return reject(err)
      if(res.statusCode === HTTPCode.NO_CONTENT || res.statusCode === HTTPCode.NOT_FOUND) return resolve(JSON.parse(body))
      return reject(BAD_CODE)
    })
  })
}

// file
let File = {}
File.create = function() {
  // not implemented
}

/*
 * @return {object} return a readable stream
 */
File.get = function(host, fs_id, object_id, start, end) {
  // 先寫死 http，假設不會有 https

  return new Promise((resolve, reject) => {
    try {
      // host parsing
      let hostParse = url.parse(host)

      const url_path = [root_path, fs_id, '/files', `/${object_id}`].join('')

      let range = (end)? `bytes=${start}-${end}`: `bytes=${start}-`
      debug('range', range)

      let req_ops = {
        hostname: hostParse.hostname,
        port: hostParse.port,
        path: url_path,
        method: 'GET',
        headers: {
          'Range': range
        },
        encoding: null
      }

      // get the response stream
      P_Req(req_ops)
      .then( res_stream => {
        return resolve(res_stream)
      })
      .catch(err => reject(err))
    } catch(err) {
      return reject(err)
    }
  })
}

File.update = function() {

}

File.del = function() {
  // not implemented
}

// exports.read = function(options) {
//   return fs.createReadStream('../fuse/fake_data/read')
// }

module.exports = {
  FileSystem,
  FileMeta,
  File
}
