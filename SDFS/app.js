"use strict"

var fuse = require('fuse-bindings')
import fuse_main from './fuse/index.js'
import { FS_Request } from './fuse/requests/fs_requests'

global.REQ = new FS_Request('./mnt', 'http://localhost:3333/', 'http://localhost:3333/')

fuse.mount('./mnt', fuse_main)

process.on('SIGINT', function () {
  fuse.unmount('./mnt', function () {
    process.exit()
  })
})
