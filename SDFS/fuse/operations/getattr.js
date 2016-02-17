import fuse from 'fuse-bindings'

export default function getattr(root, REQ, ops) {
  return (route, cb) => {
    if (!/\/$/.test(route)) route += '/'
    /**
     * TODO: cache stat of root path
     */
    // if(route === root)
    console.log('getattr of route', route)

    // need to imporve the performance by get all stats of files in the directory in a single request
    async function getAttr() {
      try {
        let stat = await REQ.getStat(route)

        // the format of time from http server response is not correct, need to renew.
        stat.mtime = new Date(stat.mtime)
        stat.atime = new Date(stat.atime)
        stat.ctime = new Date(stat.ctime)
        return stat
      } catch(err) {
        throw err
      }
    }

    // runner
    getAttr().then( stat => {
      console.log('stat:', stat)
      return cb(0, stat)
    }).catch(err => {
      console.error(err.stack)
      return cb(fuse.ENOENT)
    })
  }
}
