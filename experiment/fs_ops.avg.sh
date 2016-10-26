a=("getattr" "readdir" "mkdir" "create" "open" "truncate" "write" "read")
for i in "${a[@]}"
do
   cat ${i}_1cores.csv | awk -v ops="$i" -F',' '{sum+=$5; ++n} END { printf("%s: %d/%d = %f ns = %f us = %f ms\n", ops, sum, n, sum/n, sum/n/1000,sum/n/1000000)  }'
done
