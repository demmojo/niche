#!/bin/bash
set -e

PROJECT_ID="gtmforge-45e57"
BUCKET_NAME="${PROJECT_ID}-firestore-backups"

echo "Configuring Firestore Point-in-Time Recovery (PITR)..."
# Enable PITR on the default database
gcloud firestore databases update --database="(default)" --type=firestore-native --project=$PROJECT_ID --enable-pitr || echo "PITR might already be enabled or another error occurred."

echo "Creating GCS Bucket for cold storage exports..."
# Create a coldline bucket if it doesn't exist
gcloud storage buckets create gs://$BUCKET_NAME --project=$PROJECT_ID --location=us-central1 --default-storage-class=COLDLINE || echo "Bucket might already exist."

echo "Setting 90-day lifecycle rule for the bucket..."
cat <<EOF > lifecycle.json
{
  "rule": [
    {
      "action": {"type": "Delete"},
      "condition": {"age": 90}
    }
  ]
}
EOF
gcloud storage buckets update gs://$BUCKET_NAME --lifecycle-file=lifecycle.json
rm lifecycle.json

echo "Creating Cloud Scheduler job for weekly export..."
# Weekly at midnight Sunday (0 0 * * 0)
gcloud scheduler jobs create http firestore-weekly-export \
  --project=$PROJECT_ID \
  --schedule="0 0 * * 0" \
  --uri="https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default):exportDocuments" \
  --http-method=POST \
  --oauth-service-account-email="firestore-export@${PROJECT_ID}.iam.gserviceaccount.com" \
  --message-body="{\"outputUriPrefix\": \"gs://${BUCKET_NAME}\"}" \
  --location=us-central1 || echo "Job might already exist."

echo "Done."
