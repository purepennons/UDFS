a=("512" "1k" "4k" "16k" "64k" "128k" "1mb")
for i in "${a[@]}"
do
  cat small_read_${i}_1cores.csv | awk -v size="$i" -F',' '{sum+=$5; ++n} END { printf("%s - %s: %d/%d = %f ns = %f us = %f ms = %f s\n", "read", size, sum, n, sum/n, sum/n/1000,sum/n/1000000, sum/n/1000000000)  }'
  cat small_write_${i}_1cores.csv | awk -v size="$i" -F',' '{sum+=$5; ++n} END { printf("%s - %s: %d/%d = %f ns = %f us = %f ms = %f s\n", "write", size, sum, n, sum/n, sum/n/1000,sum/n/1000000, sum/n/1000000000)  }'
done
