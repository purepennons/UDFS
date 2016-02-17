"use strict"

import url from 'url'
import Promise from 'bluebird'
import request from 'request'

class FS_REQ {
  constructor(root='/', read_dest, write_dest) {
    if(!root || !read_dest || !write_dest) {
      console.error('Params of constructor can not be null.')
      throw new Error('Without params of constructor')
    }

    this.root = root
    this.read_dest = read_dest
    this.write_dest = write_dest
    // this.rootStat = this.getRootStat(this.root)
  }

  readdir(route) {
    let ops = {
      method: 'GET',
      uri: url.resolve(this.read_dest, route),
      qs: {
        field: ['list_only']
      },
      json: true
    }

    return new Promise( (resolve, reject) => {
      request(ops, (err, res, body) => {
        if(err) return reject(err)
        if(res.statusCode !== 200) return reject(new Error(body.message))

        // because of the request module, response headers must be underscored.
        if(res.headers['x-file-type'] !== 'directory') return reject(new Error('Target is not a directory'))
        return resolve(body.data)
      })
    })
  }

  statfs(route) {
    let ops = {
      method: 'GET',
      uri: url.resolve(this.read_dest, route),
      qs: {},
      json: true
    }

    return new Promise( (resolve, reject) => {
      request(ops, (err, res, body) => {
        if(err) return reject(err)
        if(res.statusCode !== 200) return reject(new Error(body.message))
        return resolve(body.data)
      })
    })
  }

}

export default FS_REQ
