FROM node:20-slim

WORKDIR /app

# Step 1: Install Python/pip dependencies and update package lists first.
# This ensures apt-get update runs BEFORE apt-get install python3-pip.
RUN apt-get update \
    && apt-get install -y python3-pytz \
    && rm -rf /var/lib/apt/lists/*
    
# Step 3: Install Node.js tools
RUN npm install -g firebase-tools firestore-cli

COPY dev-utils/generate_demo_subcollection_data.py dev-utils/generate-encrypted-payload.ts ./dev-utils/
COPY demo-data/facilities/ ./demo-data/facilities/
COPY demo-data/firestore-encrypted-payload.jsonl ./demo-data/seed-database.sh ./demo-data/

COPY firebase.json .firebaserc firestore.indexes.json firestore.rules .

# Make the upload script executable
RUN chmod +x ./demo-data/seed-database.sh

# Set the entrypoint to the upload script
ENTRYPOINT ["./demo-data/seed-database.sh", "--prod"]
