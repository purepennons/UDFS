import fuse from 'fuse-bindings'

export default function readdir(root, REQ, ops) {
  return (route, cb) => {
    if (!/\/$/.test(route)) route += '/'
    console.log('readdir of route', route)

    REQ.readdir(route).then( list => {
      console.log(list);
      cb(0, list)
    })
    .catch(err => {
      console.error(err.stack)
      cb(fuse.ENOENT)
    })
  }
}
