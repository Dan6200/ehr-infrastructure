FROM node:24-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g minipass-json-stream firebase-tools firestore-cli && pip3 install pytz python-dateutil --break-system-packages

COPY dev-utils ./dev-utils/
COPY demo-data ./demo-data/
COPY types ./dev-utils/generate-encrypted-payload/types
COPY lib ./dev-utils/generate-encrypted-payload/lib
COPY firebase.json .firebaserc firestore.indexes.json firestore.rules ./

# This leverages Docker layer caching
RUN cd dev-utils/generate-encrypted-payload && npm install

RUN chmod +x ./demo-data/seed-database.sh

ENTRYPOINT ["./demo-data/seed-database.sh", "--prod"]
