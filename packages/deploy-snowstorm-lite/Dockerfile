# ----------------------------------------------------
# STAGE 1: Download Snowstorm-Lite JAR & RF2 ZIP
# Base: Google Cloud SDK (for gsutil)
# ----------------------------------------------------
FROM google/cloud-sdk:slim AS downloader

# Install Java 17, curl, unzip (needed for JAR download and potentially other utils)
# curl for JAR download, unzip might not be needed if RF2 is already extracted
RUN apt-get update && \
    apt-get install -y openjdk-17-jre-headless curl && \
    rm -rf /var/lib/apt/lists/*

# Define versions and file names
ENV SNOWSTORM_VERSION=2.3.1
ENV JAR_FILE=snowstorm-lite-${SNOWSTORM_VERSION}.jar

WORKDIR /app

# Download the Snowstorm-Lite JAR
RUN curl -L -o ${JAR_FILE} \
    "https://github.com/IHTSDO/snowstorm-lite/releases/download/${SNOWSTORM_VERSION}/${JAR_FILE}"

# Build arguments for GCS access
ARG BUCKET_NAME=lean-ehr-loinc-data-7776
ARG RF2_PREFIX=snomed-packages/
ARG RF2_FILENAME=uk_sct2cl_41.0.0_20250924000001Z.zip

# Authenticate gcloud inside the Docker build using the provided access token
# Then fetch the large RF2 file directly from GCS
RUN --mount=type=secret,id=gcp_creds \
		set -x; \
		gcloud auth activate-service-account --key-file=/run/secrets/gcp_creds && \
    mkdir -p input-rf2; \
    gsutil cp gs://${BUCKET_NAME}/${RF2_PREFIX}${RF2_FILENAME} input-rf2/; \
    chmod -R 777 input-rf2/ # Ensure permissions for the snowstorm user later


# ----------------------------------------------------
# STAGE 2: Indexer - Create Lucene Index
# Base: Eclipse Temurin JRE (lighter than full JDK)
# ----------------------------------------------------
FROM eclipse-temurin:17-jre-jammy AS indexer

WORKDIR /app

# Install curl for health checks during indexing
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Copy JAR and RF2 from downloader stage
COPY --from=downloader /app/${JAR_FILE} .
COPY --from=downloader /app/input-rf2 ./input-rf2

# Define runtime variables for this stage
ENV SNOWSTORM_PORT=8080
ENV RF2_FILE=/app/input-rf2/${RF2_FILENAME}
ENV VERSION_URI=http://snomed.info/sct/900000000000207008/version/20250924
 # Use a temporary password for the build
ENV ADMIN_PASSWORD=build_password
 # Needed for loading RF2 via HTTP
ENV SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE=1000MB
 # Needed for loading RF2 via HTTP
ENV SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE=1000MB

# Ensure the 'data' directory for Lucene index is writable
# USER is still root at this point, but for later stage USER snowstorm, this is important
RUN mkdir -p /app/data && chmod -R 777 /app/data


# Index Creation Command
# This command starts Snowstorm-Lite, waits for it to be ready, loads the RF2, and then exits.
# The index will be created in /app/data (default for Snowstorm-Lite if --index.path not specified)
# Using 'bash -c' to handle background process and complex logic.
RUN set -x; \
    echo "Starting Snowstorm-Lite for indexing..."; \
    java -Xmx4G -jar ${JAR_FILE} & \
    pid=$!; \
    echo "Snowstorm-Lite PID: $pid. Waiting for startup..."; \
    # Increased timeout for health check, indexing can start later
    timeout 1800 sh -c 'while ! curl -s --fail http://localhost:${SNOWSTORM_PORT}/health; do sleep 10; done'; \
    if [ $? -ne 0 ]; then echo "Snowstorm-Lite did not become ready in time. Exiting build."; kill $pid; exit 1; fi; \
    echo "Snowstorm-Lite is ready. Loading terminology package..."; \
    \
    curl -v -X POST \
        -u admin:${ADMIN_PASSWORD} \
        -H "Accept: application/json" \
        -F "file=@${RF2_FILE}" \
        -F "version-uri=${VERSION_URI}" \
        http://localhost:${SNOWSTORM_PORT}/fhir-admin/load-package; \
    \
    if [ $? -ne 0 ]; then echo "Failed to load package. Exiting build."; kill $pid; exit 1; fi; \
    echo "Terminology package loaded. Waiting for indexing to complete..."; \
    # Depending on Snowstorm-Lite, may need to poll an indexing status endpoint
    # For now, a generous sleep to allow background indexing to finish.
    sleep 300; \
    \
    echo "Shutting down Snowstorm-Lite (PID $pid)..."; \
    kill $pid; \
    wait $pid || true; \
    echo "Snowstorm-Lite shutdown complete. Index created in /app/data"

# ----------------------------------------------------
# STAGE 3: Final Runtime Image
# Base: Eclipse Temurin JRE
# ----------------------------------------------------
FROM eclipse-temurin:17-jre-jammy

# Redefine base user and group
RUN groupadd -g 1001 install && \
    useradd -u 1001 -g install -m -s /bin/bash snowstorm

WORKDIR /app

# Copy JAR from downloader stage
COPY --from=downloader /app/${JAR_FILE} .

# Copy the generated Lucene index from the indexer stage
# This is the critical step for pre-built index
COPY --from=indexer --chown=snowstorm:install /app/data ./data

# Switch to non-root user
USER snowstorm

# Define runtime variables
ENV SNOWSTORM_PORT=8080
ENV VERSION_URI=http://snomed.info/sct/900000000000207008/version/20250924
ENV ADMIN_PASSWORD=${SNOWSTORM_ADMIN_PASSWORD}

EXPOSE ${SNOWSTORM_PORT}

# Final CMD: Just start the server using the pre-built index
# Snowstorm-Lite defaults to ./data for index, so no --index.path is usually needed
CMD ["java", "-Xmx1G", "-jar", "${JAR_FILE}", "--admin.password=${ADMIN_PASSWORD}"]
