a=("512" "1k" "4k" "16k" "64k" "128k")
for i in "${a[@]}"
do
  cat io_bound-ssd_hdd_diff_blk_${i}_200mb_read_4cores.csv | grep storage_hdd_e2 > io_bound-hdd_diff_blk_size_${i}_read.csv
  cat io_bound-ssd_hdd_diff_blk_${i}_200mb_read_4cores.csv | grep storage_ssd_e2 > io_bound-ssd_diff_blk_size_${i}_read.csv

  cat io_bound-ssd_hdd_diff_blk_${i}_200mb_write_4cores.csv | grep storage_hdd_e2 > io_bound-hdd_diff_blk_size_${i}_write.csv
  cat io_bound-ssd_hdd_diff_blk_${i}_200mb_write_4cores.csv | grep storage_ssd_e2 > io_bound-ssd_diff_blk_size_${i}_write.csv
done
