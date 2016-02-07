"use strict"

var fuse = require('fuse-bindings')
import fuse_main from './fuse/index.js'
fuse.mount('./mnt', fuse_main)

process.on('SIGINT', function () {
  fuse.unmount('./mnt', function () {
    process.exit()
  })
})
