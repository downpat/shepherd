#!/bin/bash

# DreamShepherd Database Entrypoint Script
# Handles permissions for mounted volumes and starts MongoDB

echo "Starting DreamShepherd Database..."

# Create data directory if it doesn't exist
mkdir -p /data/db

# Fix ownership of mounted volume (if running as root)
if [ "$(id -u)" = "0" ]; then
    echo "Setting ownership of /data/db to mongodb:mongodb"
    chown -R mongodb:mongodb /data/db
    
    # Switch to mongodb user and start mongod
    echo "Starting MongoDB as mongodb user"
    exec su mongodb -s /bin/bash -c "mongod --bind_ip_all --port 27017"
else
    # Already running as mongodb user
    echo "Starting MongoDB directly"
    exec mongod --bind_ip_all --port 27017
fi