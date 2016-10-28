cat peformance_designate_extensionType_local_hdd_remote_jpg_3storages_100times_read.csv | awk -F',' '{sum+=$5;} END { print "read: " sum/1000000000 "s"}'
cat peformance_designate_extensionType_local_hdd_remote_jpg_3storages_100times_write.csv | awk -F',' '{sum+=$5;} END { print "write: " sum/1000000000 "s"}'
