#!/bin/bash

# MongoDB Replica Set Configuration Script
# This script sets up a MongoDB replica set for AttendancePlus

echo "Starting MongoDB Replica Set Configuration..."

# Start MongoDB instances
mongod --replSet rs0 --port 27017 --dbpath /data/db1 --logpath /var/log/mongodb/mongod1.log --fork
mongod --replSet rs0 --port 27018 --dbpath /data/db2 --logpath /var/log/mongodb/mongod2.log --fork
mongod --replSet rs0 --port 27019 --dbpath /data/db3 --logpath /var/log/mongodb/mongod3.log --fork

# Wait for MongoDB to start
sleep 10

# Initialize replica set
mongo --port 27017 --eval "
rs.initiate({
  _id: 'rs0',
  members: [
    { _id: 0, host: 'localhost:27017' },
    { _id: 1, host: 'localhost:27018' },
    { _id: 2, host: 'localhost:27019' }
  ]
})
"

echo "Replica set configuration completed!"
echo "Use 'rs.status()' to check replica set status"
