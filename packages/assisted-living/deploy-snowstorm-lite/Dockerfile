# ----------------------------------------------------
# STAGE 1: Build & Data Fetch
# Goal: Download the Snowstorm-Lite JAR and the RF2 ZIP file
# ----------------------------------------------------
FROM ubuntu:22.04 AS builder

# Install Java 17 and curl/unzip utilities
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless curl unzip && \
    rm -rf /var/lib/apt/lists/*

# Define the Snowstorm-Lite release URL and your RF2 file info
# IMPORTANT: Adjust the SNOWSTORM_VERSION if you change the release tag
ENV SNOWSTORM_VERSION=2.3.1
ENV JAR_FILE=snowstorm-lite-${SNOWSTORM_VERSION}.jar

# 1. Download the Snowstorm-Lite JAR from GitHub Releases
RUN mkdir -p /app \
&& curl -L -o /app/${JAR_FILE} \
    "https://github.com/IHTSDO/snowstorm-lite/releases/download/${SNOWSTORM_VERSION}/${JAR_FILE}"

# 2. Download your LARGE RF2 file using gsutil/gcloud
# Note: You MUST ensure your build service account has 'Storage Object Viewer' role
# on the 'lean-ehr-loinc-data-7776' bucket.
ENV BUCKET_NAME=lean-ehr-loinc-data-7776
ENV RF2_PREFIX=snomed-packages/
ENV RF2_FILENAME=uk_sct2cl_41.0.0_20250924000001Z.zip 

# Install gcloud/gsutil in the builder stage to fetch the file
RUN curl -sSL https://dl.google.com/dl/cloudsdk/install_google_cloud_sdk.bash | bash -s -- --install-dir=/opt/gcloud --quiet
ENV PATH="/opt/gcloud/bin:${PATH}"

# Fetch the large RF2 file directly during the build
RUN mkdir -p /app/input-rf2
RUN gsutil cp gs://${BUCKET_NAME}/${RF2_PREFIX}${RF2_FILENAME} /app/input-rf2/

# ----------------------------------------------------
# STAGE 2: Runtime Image & Index Creation
# Goal: Run the data load command and then start the server
# ----------------------------------------------------
FROM ubuntu:22.04

# Install Java 17 and copy necessary files from the builder stage
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless && \
    rm -rf /var/lib/apt/lists/*
    
WORKDIR /app

# Copy the JAR and the RF2 file from the builder stage
COPY --from=builder /app/${JAR_FILE} .
COPY --from=builder /app/input-rf2 /app/input-rf2

# Define runtime variables
ENV SNOWSTORM_PORT=8080
ENV RF2_FILE=/app/input-rf2/${RF2_FILENAME}
ENV VERSION_URI=http://snomed.info/sct/900000000000207008/version/20250924

# Expose the application port
EXPOSE ${SNOWSTORM_PORT}

# The main command: First load the index, then run the server
# We use the '--load' parameter which is documented to handle the file path.
CMD \
    # 1. Start with the index creation (Option 2 from docs)
    java -Xmx1G -jar ${JAR_FILE} \
        --load=${RF2_FILE} \
        --version-uri=${VERSION_URI} \
        --admin.password=${ADMIN_PASSWORD} \
    && \
    # 2. Start the FHIR Terminology Server (documented next step)
    exec java -Xmx1G -jar ${JAR_FILE}
