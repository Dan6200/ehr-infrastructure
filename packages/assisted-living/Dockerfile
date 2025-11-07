FROM node:20-slim

WORKDIR /app

RUN npm install -g firebase-tools firestore-cli apt-get update && apt-get install -y python3-pip && pip3 install pytz

COPY dev-utils/generate_demo_subcollection_data.py dev-utils/generate-encrypted-payload.ts ./dev-utils/
COPY demo-data/facilities/ ./demo-data/facilities/
COPY demo-data/firestore-encrypted-payload.jsonl ./demo-data/seed-database.sh ./demo-data/

COPY firebase.json .firebaserc firestore.indexes.json firestore.rules .

# Make the upload script executable
RUN chmod +x ./demo-data/seed-database.sh

# Set the entrypoint to the upload script
ENTRYPOINT ["./demo-data/seed-database.sh", "--prod"]
