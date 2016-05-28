const fs = require('fs-extra')

exports.read = function(options) {
  return fs.createReadStream('../fuse/fake_data/read')
}
