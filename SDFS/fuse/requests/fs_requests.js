import url from 'url'
import Promise from 'bluebird'
import request from 'request'

export class FS_Request {
  constructor(root, read_dest, write_dest) {
    this.root = root
    this.read_dest = read_dest
    this.write_dest = write_dest
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
        if() return reject(new Error('Target is not a directory'))
        return resolve(body.data)
      })
    })
  }
}
