umount ./mnt
kill $(ps aux | grep node | awk '{print $1}')
node entry.js
