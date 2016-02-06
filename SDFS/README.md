# SDFS
## Development
* Start a Docker container with fuse and node.js environment
      docker run -itd --name sdfs  -v "$PWD:/src" -w "/src" -p 8888:8888 --privileged chiahao/fuse-node-alpine:4.2.x bash
