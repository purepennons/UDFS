# write blk size = 64k
shjs write_single.js 512 1 100 512_single /home/root/thesis_src/thesis/src/mnt/exp_512_single
shjs write_single.js 1k 1 100 1k_single /home/root/thesis_src/thesis/src/mnt/exp_1k_single
shjs write_single.js 4k 1 100 4k_single /home/root/thesis_src/thesis/src/mnt/exp_4k_single
shjs write_single.js 16k 1 100 16k_single /home/root/thesis_src/thesis/src/mnt/exp_16k_single
shjs write_single.js 64k 1 100 64k_single /home/root/thesis_src/thesis/src/mnt/exp_64k_single
shjs write_single.js 64k 2 100 128k_single /home/root/thesis_src/thesis/src/mnt/exp_128k_single
shjs write_single.js 64k 16 100 1m_single /home/root/thesis_src/thesis/src/mnt/exp_1m_single

# read
shjs read_single.js 512 1 100 512_single /home/root/thesis_src/thesis/src/mnt/exp_512_single
shjs read_single.js 1k 1 100 1k_single /home/root/thesis_src/thesis/src/mnt/exp_1k_single
shjs read_single.js 4k 1 100 4k_single /home/root/thesis_src/thesis/src/mnt/exp_4k_single
shjs read_single.js 16k 1 100 16k_single /home/root/thesis_src/thesis/src/mnt/exp_16k_single
shjs read_single.js 64k 1 100 64k_single /home/root/thesis_src/thesis/src/mnt/exp_64k_single
shjs read_single.js 64k 2 100 128k_single /home/root/thesis_src/thesis/src/mnt/exp_128k_single
shjs read_single.js 64k 16 100 1m_single /home/root/thesis_src/thesis/src/mnt/exp_1m_single
