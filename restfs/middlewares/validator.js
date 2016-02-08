import fs from 'fs'

function typeValidator(req, res, next) {
  fs.stat(req.file_path, (err, st) => {
    if(err) {
      err.status = 404
      return next(err)
    }

    if(st.isDirectory()) {
      req.type = 'directory'
    } else {
      req.type = 'file'
    }

    req.stat = st

    console.log('type: ', req.type)
    console.log('stat', req.stat)

    return next()
  })
}

export { typeValidator }
