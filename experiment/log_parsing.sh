a=("512" "1k" "4k" "16k" "64k" "128k")
for i in "${a[@]}"
do
  cat ssd_hdd_diff_blk_size_200mb_read_8cores.csv | grep exp_blk_${i}_single_200mb | grep storage_hdd_e2 > io_bound-hdd_diff_blk_size_200mb_${i}_read_8cores.csv
  cat ssd_hdd_diff_blk_size_200mb_read_8cores.csv | grep exp_blk_${i}_single_200mb | grep storage_ssd_e2 > io_bound-ssd_diff_blk_size_200mb_${i}_read_8cores.csv

  cat ssd_hdd_diff_blk_size_200mb_write_8cores.csv | grep exp_blk_${i}_single_200mb | grep storage_hdd_e2 > io_bound-hdd_diff_blk_size_200mb_${i}_write_8cores.csv
  cat ssd_hdd_diff_blk_size_200mb_write_8cores.csv | grep exp_blk_${i}_single_200mb | grep storage_ssd_e2 > io_bound-ssd_diff_blk_size_200mb_${i}_write_8cores.csv
done
