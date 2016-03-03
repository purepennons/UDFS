import express from 'express'

const router = express.Router()

router.post('/:fs_name', (req, res, next) => {
  let fs_name = req.params.fs_name
  let read_dest = req.body.read_dest
  let write_dest = req.body.write_dest

  global.sdfs.setReadDest(read_dest)
  global.sdfs.setWriteDest(write_dest)

  res.json({
    status: 'success',
    fs_name,
    read_dest,
    write_dest
  })
})

export default router
