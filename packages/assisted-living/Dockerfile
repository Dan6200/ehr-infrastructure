FROM node:20-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g firebase-tools firestore-cli && pip3 install pytz --break-system-packages

COPY dev-utils/generate_demo_subcollection_data.py dev-utils/generate-encrypted-payload.ts ./dev-utils/
COPY demo-data/facilities/ ./demo-data/facilities/
COPY ./demo-data/seed-database.sh ./demo-data/

COPY firebase.json .firebaserc firestore.indexes.json firestore.rules ./

# Make the upload script executable
RUN chmod +x ./demo-data/seed-database.sh

# Set the entrypoint to the upload script
ENTRYPOINT ["./demo-data/seed-database.sh", "--prod"]
