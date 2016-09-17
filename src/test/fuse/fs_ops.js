const fs = require('fs-extra')
const path = require('path')

const fuse_path = '/src/src/mnt'

try {
  fs.mkdirSync(path.join(fuse_path, '/fuse_test'))
  fs.openSync(path.join(fuse_path, '/fuse_file.txt'), 'w+')
} catch(err) {
  console.error(err.stack)
}
