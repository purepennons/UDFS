"use strict"

var fuse = require('fuse-bindings')
import fuse_main from './fuse/index.js'
import { FS_Request } from './fuse/requests/fs_requests'

const root = './mnt'

global.REQ = new FS_Request(root, 'http://localhost:3333/', 'http://localhost:3333/')

fuse.mount(root, fuse_main(root))

process.on('SIGINT', function () {
  fuse.unmount(root, function () {
    process.exit()
  })
})
