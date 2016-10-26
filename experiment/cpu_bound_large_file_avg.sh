a=("1mb" "10mb" "100mb" "500mb" "1gb")
for i in "${a[@]}"
do
  cat large_read_${i}_4cores.csv | awk -v size="$i" -F',' '{sum+=$5; ++n} END { printf("%s - %s: %d/%d = %f ns = %f us = %f ms = %f s\n", "read", size, sum, n, sum/n, sum/n/1000,sum/n/1000000, sum/n/1000000000)  }'
  cat large_write_${i}_4cores.csv | awk -v size="$i" -F',' '{sum+=$5; ++n} END { printf("%s - %s: %d/%d = %f ns = %f us = %f ms = %f s\n", "write", size, sum, n, sum/n, sum/n/1000,sum/n/1000000, sum/n/1000000000)  }'
done
