FROM node:24-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g minipass-json-stream firebase-tools firestore-cli && pip3 install pytz --break-system-packages

COPY dev-utils ./dev-utils/
COPY demo-data ./demo-data/
COPY lib ./lib/

COPY firebase.json .firebaserc firestore.indexes.json firestore.rules ./

# Make the upload script executable
RUN chmod +x ./demo-data/seed-database.sh

# Set the entrypoint to the upload script
ENTRYPOINT ["./demo-data/seed-database.sh", "--prod"]
