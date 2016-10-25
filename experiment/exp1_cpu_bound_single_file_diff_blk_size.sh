# write blk size = 512, 1k, 4k, 16k, 64k, 128k
shjs write_single.js 512 409600 10 blk_512_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_512_single_200mb
shjs write_single.js 1k 204800 10 blk_1k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_1k_single_200mb
shjs write_single.js 4k 51200 10 blk_4k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_4k_single_200mb
shjs write_single.js 16k 12800 10 blk_16k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_16k_single_200mb
shjs write_single.js 64k 3200 10 blk_64k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_64k_single_200mb
shjs write_single.js 128k 1600 10 blk_128k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_128k_single_200mb

# read blk size = 512, 1k, 4k, 16k, 64k, 128k
shjs read_single.js 512 409600 10 blk_512_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_512_single_200mb
shjs read_single.js 1k 204800 10 blk_1k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_1k_single_200mb
shjs read_single.js 4k 51200 10 blk_4k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_4k_single_200mb
shjs read_single.js 16k 12800 10 blk_16k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_16k_single_200mb
shjs read_single.js 64k 3200 10 blk_64k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_64k_single_200mb
shjs read_single.js 128k 1600 10 blk_128k_single_200mb /home/root/thesis_src/thesis/src/mnt/exp_blk_128k_single_200mb
