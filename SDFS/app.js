"use strict"

var fuse = require('fuse-bindings')
import SDFS from './fuse/index.js'
import { FS_Request } from './fuse/index'

const root = './mnt'

// global.REQ = new FS_Request(root, 'http://localhost:3333/', 'http://localhost:3333/')

let sdfs = new SDFS({
  root: root,
  read_dest: 'http://localhost:3333/',
  write_dest: 'http://localhost:3333/',
  fuse_ops: {
    options: ['direct_io']
  }
})

sdfs.mount()
.then( () => {
  console.log('SDFS is mounted at %s', root)
})
.catch( err => {
  console.error('FUSE mounts failed.')
  process.exit()
})

process.on('SIGINT', function () {
  sdfs.unmount()
  .then( () => {
    process.exit()
  })
  .catch( err => {
    console.error('unmount fuse error', err)
    process.exit()
  })
})
