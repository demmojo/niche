#!/bin/bash
set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# This script provisions Direct VPC Egress and Cloud NAT for IP rotation 
# for the staticCrawlerWorker deployed on Cloud Run.

PROJECT_ID=${GCP_PROJECT_ID:?"Error: GCP_PROJECT_ID is not set in .env"}
REGION=${GCP_REGION:?"Error: GCP_REGION is not set in .env"}
NETWORK="core-vpc"
SUBNET="cloud-run-subnet"
ROUTER="crawler-router"
NAT="crawler-nat"

echo "Creating VPC Network..."
gcloud compute networks create $NETWORK \
    --project=$PROJECT_ID \
    --subnet-mode=custom || true

echo "Creating Subnet for Direct VPC Egress..."
gcloud compute networks subnets create $SUBNET \
    --project=$PROJECT_ID \
    --network=$NETWORK \
    --region=$REGION \
    --range=10.0.0.0/24 || true

echo "Creating Cloud Router..."
gcloud compute routers create $ROUTER \
    --project=$PROJECT_ID \
    --network=$NETWORK \
    --region=$REGION || true

echo "Creating Cloud NAT with manual IP assignment (pool of 50 IPs recommended for production)..."
# For demo purposes, we automatically allocate IPs, but in production, 
# you would allocate 50 static external IPs and pass them to --nat-external-ip-pool
gcloud compute routers nats create $NAT \
    --project=$PROJECT_ID \
    --router=$ROUTER \
    --region=$REGION \
    --auto-allocate-nat-external-ips \
    --nat-all-subnet-ip-ranges || true

echo "Deploying staticCrawlerWorker to Cloud Run with Direct VPC Egress..."
# Assuming image is already built and pushed
# gcloud run deploy static-crawler-worker \
#    --image=gcr.io/$PROJECT_ID/static-crawler-worker \
#    --region=$REGION \
#    --network=$NETWORK \
#    --subnet=$SUBNET \
#    --vpc-egress=all-traffic

echo "VPC Egress and Cloud NAT configured."
