#!/bin/bash
# Configure S3 Lifecycle rules for raw blobs (Phase 5)

aws s3api put-bucket-lifecycle-configuration \
  --bucket nicheai-raw-data-blobs \
  --lifecycle-configuration '{
    "Rules": [
      {
        "ID": "RawBlobTTL-30Days",
        "Prefix": "raw/",
        "Status": "Enabled",
        "Expiration": {
          "Days": 30
        }
      }
    ]
  }'

echo "Configured 30-day TTL lifecycle rule on nicheai-raw-data-blobs."
