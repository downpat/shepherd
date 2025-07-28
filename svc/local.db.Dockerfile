# DreamShepherd Database - Local Development
FROM mongodb/mongodb-community-server:latest

# Set environment variables (using new variable names)
ENV MONGODB_INITDB_ROOT_USERNAME=dreamshepherd
ENV MONGODB_INITDB_ROOT_PASSWORD=shepherd_dev_pass
ENV MONGO_INITDB_DATABASE=dreamshepherd

# Switch to root to handle permissions
USER root

# Copy custom entrypoint script with executable permissions
COPY --chmod=755 db-entrypoint.sh /entrypoint.sh

# Expose MongoDB port
EXPOSE 27017

# Use custom entrypoint
ENTRYPOINT ["/entrypoint.sh"]