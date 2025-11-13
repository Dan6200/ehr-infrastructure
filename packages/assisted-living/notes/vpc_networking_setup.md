# VPC Networking and NAT Gateway Setup

This document explains why a NAT (Network Address Translation) gateway is necessary for this project and provides the `gcloud` commands to configure it.

---

## 1. The Problem: Services in a VPC Need Internet Access

When a serverless service (like a Cloud Run job or Cloud Function) is configured to connect to a resource within a VPC (Virtual Private Cloud), such as a Memorystore for Redis instance, it is placed inside that VPC's network boundary.

By default, resources inside a VPC do not have a route to the public internet for security reasons.

This creates a problem: the service can talk to Redis, but it can no longer talk to public Google Cloud APIs, such as:

- `oauth2.googleapis.com` (to get authentication tokens)
- `bigquery.googleapis.com` (to run queries)
- `cloudkms.googleapis.com` (to use KMS keys)

This results in network timeout errors, such as `ETIMEDOUT` when trying to connect to `https://oauth2.googleapis.com/token`.

---

## 2. The Solution: Cloud NAT

**Cloud NAT (Network Address Translation)** is a managed Google Cloud service that allows resources within a VPC without public IP addresses to send outbound traffic to the internet.

It works by routing outbound traffic from your private services through a managed gateway that has public internet access. This is the standard and most secure way to grant internet access to private services.

---

## 3. Implementation Steps

The setup involves two main resources: a **Cloud Router** and the **Cloud NAT gateway** itself.

### Step 1: Create a Cloud Router

The Cloud Router manages the routes that allow the NAT gateway to function.

```bash
# Replace [REGION] with your actual GCP region (e.g., europe-west1)
gcloud compute routers create lean-ehr-router \
    --network=default \
    --region=[REGION] \
    --project=lean-ehr
```

### Step 2: Create the Cloud NAT Gateway

This command creates the NAT gateway and configures it to provide internet access to all subnets in the default VPC network within the specified region.

```bash
# Replace [REGION] with your actual GCP region (e.g., europe-west1)
gcloud compute nats create lean-ehr-nat-gateway \
    --router=lean-ehr-router \
    --region=[REGION] \
    --auto-allocate-nat-external-ips \
    --nat-all-subnet-ip-ranges \
    --project=lean-ehr
```

---

## Summary

After completing these two steps, any serverless service within the specified region's VPC will be able to make outbound requests to the public internet, resolving the `ETIMEDOUT` errors when connecting to Google Cloud APIs. This is a one-time infrastructure setup.
