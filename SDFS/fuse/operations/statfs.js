import fuse from 'fuse-bindings'

export default function statfs(root, REQ, ops) {
  return (route, cb) => {
    if (!/\/$/.test(route)) route += '/'
    /**
     * TODO: cache stat of root path
     */
    // if(route === root)
    console.log('statfs of route', route)

    REQ.statfs(route).then( data => {
      cb(0, data.stat)
    })
    .catch(err => {
      console.error(err.stack)
      cb(fuse.ENOENT)
    })
  }
}
