a=("512" "1k" "4k" "16k" "64k" "128k")
for i in "${a[@]}"
do
  cat io_bound-ssd_diff_blk_size_${i}_read.csv | awk -v size="$i" -F',' '{sum+=$5; ++n} END { printf("%s - %s: %d/%d = %f ns = %f us = %f ms = %f s, %f MB/s\n", "read", size, sum, n, sum/n, sum/n/1000,sum/n/1000000, sum/n/1000000000, 200/(sum/n/1000000000) )  }'
  cat io_bound-ssd_diff_blk_size_${i}_write.csv | awk -v size="$i" -F',' '{sum+=$5; ++n} END { printf("%s - %s: %d/%d = %f ns = %f us = %f ms = %f s, %f MB/s\n", "write", size, sum, n, sum/n, sum/n/1000,sum/n/1000000, sum/n/1000000000, 200/(sum/n/1000000000) )  }'
done
