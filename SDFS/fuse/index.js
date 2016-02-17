"use strict"

import fuse from 'fuse-bindings'
import FS_REQ from './requests/fs_requests'

// fuse callbacks
import readdir from './operations/readdir'
import statfs from './operations/statfs'

class SDFS extends FS_REQ {

  constructor(ops) {
    // inherit methods and variables from FS_REQ
    super(ops.root, ops.read_dest, ops.write_dest)

    // ops: root, read_dest, write_dest

    // unnecessary, auto inherit from FS_REQ
    // this.root = ops.root
    // this.read_dest = ops.read_dest
    // this.write_dest = ops.write_dest

    this.fuse_ops = ops.fuse_ops || {
      //  options of fuse-bindings
      // options: ['direct_io']
    }

    // initial the configuration fo storage
    // this.REQ = new FS_REQ(this.root, this.read_dest, this.write_dest)
  }

  // set/get variables
  setReadDest(read_dest) {
    if(read_dest) {
      this.read_dest = read_dest
      return true
    }
    return false
  }

  setWriteDest(write_dest) {
    if(write_dest) {
      this.write_dest = write_dest
      return true
    }
    return false
  }

  // mount fuse
  mount() {
    return new Promise( (resolve, reject) => {
      let fuseContext = this.getFuseContext(this.root, this, this.fuse_ops)
      fuse.mount(this.root, fuseContext, err => {
        if(err) return reject(err)
        return resolve()
      })
    })
  }

  unmount() {
    return new Promise( (resolve, reject) => {
      fuse.unmount(this.root, err => {
        if(err) return reject(err)
        return resolve()
      })
    })
  }

  // must pass the fuse context to the mount method
  getFuseContext(root='/', FS_REQ, fuse_ops) {
    let ops = {}

    // ops.options = ['direct_io', 'dev', 'debug']
    ops.options = fuse_ops.options || ['direct_io']

    ops.init = function(cb) {
      console.log('init is not implementation')
      cb(0)
    }

    ops.access = function(path, mode, cb) {
      console.log('access is not implementation')
      cb(0)
    }

    // ops.statfs = statfs(root)
    ops.statfs = function (path, cb) {
    console.log('statfs is not implementation')
    cb(0, {
      bsize: 1000000,
      frsize: 1000000,
      blocks: 1000000,
      bfree: 1000000,
      bavail: 1000000,
      files: 1000000,
      ffree: 1000000,
      favail: 1000000,
      fsid: 1000000,
      flag: 1000000,
      namemax: 1000000
    })
  }

    ops.getattr = function(path, cb) {
      console.log('getattr is not implementation')
      cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        size: 100,
        mode: 16877,
        uid: 1000000,
        gid: 1000000
      })
    }

    ops.fgetattr = function(path, fd, cb) {
      console.log('fgetattr is not implementation')
      cb(0, {
        mtime: new Date(),
        atime: new Date(),
        ctime: new Date(),
        size: 100,
        mode: 16877,
        uid: 1000000,
        gid: 1000000
      })
    }

    ops.flush = function(path, fd, cb) {
      console.log('flush is not implementation')
      cb(0)
    }

    ops.fsync = function(path, fd, datasync, cb) {
      console.log('fsync is not implementation')
      cb(0)
    }

    ops.fsyncdir = function(path, fd, datasync, cb) {
      console.log('fsyncdir is not implementation')
      cb(0)
    }

    ops.readdir = readdir(root, FS_REQ)

    ops.truncate = function(path, size, cb) {
      console.log('truncate is not implementation')
      cb(0)
    }

    ops.ftruncate = function(path, fd, size, cb) {
      console.log('ftruncate is not implementation')
      cb(0)
    }

    ops.readlink = function(path, cb) {
      console.log('readlink is not implementation')
      cb(0, 'file.txt')
    }

    ops.chown = function(path, uid, gid, cb) {
      console.log('chown is not implementation')
      cb(0)
    }

    ops.chmod = function(path, mode, cb) {
      console.log('chmod is not implementation')
      cb(0)
    }

    ops.mknod = function(path, mode, dev, cb) {
      console.log('mknod is not implementation')
      cb(0)
    }

    ops.setxattr = function(path, name, buffer, length, offset, flags, cb) {
      console.log('setxattr is not implementation')
      cb(0)
    }

    ops.getxattr = function(path, name, buffer, length, offset, cb) {
      console.log('getxattr is not implementation')
      cb(0)
    }

    // var toFlag = function(flags) {
    //   flags = flags & 3
    //   if (flags === 0) return 'r'
    //   if (flags === 1) return 'w'
    //   return 'r+'
    // }
    ops.open = function(path, flags, cb) {
      console.log('open is not implementation')
      cb(0, 42) // 42 is a file descriptor
    }

    ops.opendir = function(path, flags, cb) {
      console.log('opendir is not implementation')
      cb(0, 43) // 43 is a file descriptor
    }

    ops.read = function(path, fd, buffer, length, position, cb) {
      console.log('read is not implementation')
      // part is a buffer for content
      //part.copy(buffer) // write the result of the read to the result buffer
      cb(100) // return the number of bytes read
    }

    ops.write = function(path, fd, buffer, length, position, cb) {
      console.log('write is not implementation')
      // buffer is the content that will be writed
      cb(length) // we handled all the data
    }

    ops.release = function(path, fd, cb) {
      console.log('release is not implementation')
      cb(0)
    }

    ops.releasedir = function(path, fd, cb) {
      console.log('releasedir is not implementation')
      cb(0)
    }

    ops.create = function(path, mode, cb) {
      console.log('create is not implementation')
      cb(0)
    }

    ops.utimens = function(path, atime, mtime, cb) {
      console.log('utimens is not implementation')
      cb(0)
    }

    ops.unlink = function(path, cb) {
      console.log('unlink is not implementation')
      cb(0)
    }

    ops.rename = function(src, dest, cb) {
      console.log('rename is not implementation')
      cb(0)
    }

    ops.link = function(src, dest, cb) {
      console.log('link is not implementation')
      cb(0)
    }

    ops.symlink = function(src, dest, cb) {
      console.log('symlink is not implementation')
      cb(0)
    }

    ops.mkdir = function(path, mode, cb) {
      console.log('mkdir is not implementation')
      cb(0)
    }

    ops.rmdir = function(path, cb) {
      console.log('rmdir is not implementation')
      cb(0)
    }

    ops.destroy = function(cb) {
      console.log('destroy is not implementation')
      cb(0)
    }
    return ops
  }
}

export default SDFS
