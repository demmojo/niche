#!/bin/bash
set -e

# Load environment variables from .env if it exists
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Data Moat Deployment Script
# This script provisions the necessary GCP infrastructure and deploys the Cloud Run workers.

PROJECT_ID=${GCP_PROJECT_ID:?"Error: GCP_PROJECT_ID is not set in .env or environment"}
REGION=${GCP_REGION:?"Error: GCP_REGION is not set in .env or environment"}
LAKE_BUCKET_NAME=${LAKE_BUCKET_NAME:?"Error: LAKE_BUCKET_NAME is not set in .env or environment"}
GEMINI_API_KEY=${GEMINI_API_KEY:?"Error: GEMINI_API_KEY is not set in .env or environment"}

# Verify necessary APIs are enabled
echo "=== 0. Enabling Required GCP APIs ==="
gcloud services enable \
    run.googleapis.com \
    storage.googleapis.com \
    bigquery.googleapis.com \
    cloudtasks.googleapis.com \
    customsearch.googleapis.com \
    --project=$PROJECT_ID

echo "=== 1. Provisioning Infrastructure ==="

# Create Cloud Storage Bucket
echo "Creating GCS Bucket gs://$LAKE_BUCKET_NAME..."
gcloud storage buckets create gs://$LAKE_BUCKET_NAME --location=$REGION --project=$PROJECT_ID || true

# Create BigQuery Dataset
echo "Creating BigQuery Dataset..."
bq mk --location=$REGION -d $PROJECT_ID:saas_oracle || true

# Initialize BigQuery Tables from our SQL script
echo "Running BigQuery Schema initialization..."
bq query --use_legacy_sql=false < scripts/bq_schema_and_merge.sql

# Create Cloud Tasks Queue
echo "Creating Cloud Tasks Queue..."
gcloud tasks queues create market-intelligence-seed \
  --location=$REGION \
  --max-dispatches-per-second=500 \
  --max-concurrent-dispatches=100 || true

echo "=== 2. Skipping Google Custom Search Setup ==="
echo "Note: Google Programmable Search 'Search the entire web' was deprecated."
echo "We now use Vertex AI / Gemini Search Grounding for proxy metrics."

echo "=== 3. Deploying Cloud Run Workers ==="

# Note: This assumes you have a Dockerfile at the root of your project
# and your package.json scripts are set up to run the specific worker files.

# Deploy Static Crawler (Requires VPC Egress configured via configure_vpc_egress.sh)
echo "Deploying Static Crawler Worker..."
gcloud run deploy static-crawler-worker \
  --source . \
  --region $REGION \
  --command "node" \
  --args "dist/server/workers/staticCrawlerWorker.js" \
  --network core-vpc \
  --subnet cloud-run-subnet \
  --vpc-egress all-traffic \
  --set-env-vars LAKE_BUCKET_NAME=$LAKE_BUCKET_NAME,GEMINI_API_KEY=${GEMINI_API_KEY} \
  --allow-unauthenticated

# Deploy Normalization Adapter Job (Note: Cloud Run Jobs are used for batch/array processing)
echo "Deploying Normalization Adapter Job..."
gcloud run jobs create normalization-adapter-job \
  --source . \
  --region $REGION \
  --command "node" \
  --args "dist/server/workers/normalizationAdapterJob.js" \
  --tasks 10000 \
  --set-env-vars LAKE_BUCKET_NAME=$LAKE_BUCKET_NAME,GEMINI_API_KEY=${GEMINI_API_KEY}

# Deploy Batch Reconciliation Job
echo "Deploying Batch Reconciliation Job..."
gcloud run jobs create batch-reconciliation-job \
  --source . \
  --region $REGION \
  --command "node" \
  --args "dist/server/workers/batchReconciliationJob.js" \
  --set-env-vars GEMINI_API_KEY=${GEMINI_API_KEY}

# Deploy Vector Sync Worker (Scheduled Job)
echo "Deploying Vector Sync Worker Job..."
gcloud run jobs create vector-sync-worker \
  --source . \
  --region $REGION \
  --command "node" \
  --args "dist/server/workers/vectorSyncWorker.js" \
  --set-env-vars GEMINI_API_KEY=${GEMINI_API_KEY}

echo "=== Deployment Complete! ==="
echo "To start the Data Moat pipeline, run:"
echo "  npx tsx scripts/seed-domains.ts"
