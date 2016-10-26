cat create_1cores.csv | awk -F',' '{sum+=$5; ++n} END { print "Avg: "sum"/"n"="sum/n }'
