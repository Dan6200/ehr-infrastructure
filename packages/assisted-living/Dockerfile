FROM node:24-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends python3-pip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

RUN npm install -g minipass-json-stream firebase-tools firestore-cli && pip3 install pytz --break-system-packages

COPY dev-utils ./dev-utils/
COPY demo-data ./demo-data/
COPY types ./dev-utils/generate-encrypted-payload/types
COPY lib/encryption.ts ./dev-utils/generate-encrypted-payload/lib/
COPY functions ./functions
COPY types ./functions/lib/types
COPY lib/encryption.ts ./functions/lib/lib/
COPY lib/bigquery/index.ts ./functions/lib/lib/bigquery/index.ts
COPY firebase.json .firebaserc firestore.indexes.json firestore.rules ./

# This leverages Docker layer caching
RUN cd dev-utils/generate-encrypted-payload && npm install

RUN cd functions/ && npm install && npm run build && echo "lib/lib/" && ls lib/lib/

RUN chmod +x ./demo-data/seed-database.sh

ENTRYPOINT ["./demo-data/seed-database.sh", "--prod"]
