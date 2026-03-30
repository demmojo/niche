terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Artifact Registry to store the Docker image
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "nicheai-repo"
  description   = "Docker repository for NicheAI"
  format        = "DOCKER"
}

# Dedicated Service Account for Cloud Run with least privilege
resource "google_service_account" "cloudrun_sa" {
  account_id   = "nicheai-cloudrun-sa"
  display_name = "NicheAI Cloud Run Service Account"
}

# Secret Manager Secrets
resource "google_secret_manager_secret" "gemini_api_key" {
  secret_id = "gemini-api-key"
  replication { auto {} }
}
resource "google_secret_manager_secret_version" "gemini_api_key" {
  secret = google_secret_manager_secret.gemini_api_key.id
  secret_data = var.gemini_api_key
}
resource "google_secret_manager_secret_iam_member" "gemini_api_key_access" {
  secret_id = google_secret_manager_secret.gemini_api_key.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

resource "google_secret_manager_secret" "firebase_sa" {
  secret_id = "firebase-service-account"
  replication { auto {} }
}
resource "google_secret_manager_secret_version" "firebase_sa" {
  secret = google_secret_manager_secret.firebase_sa.id
  secret_data = var.firebase_service_account_base64
}
resource "google_secret_manager_secret_iam_member" "firebase_sa_access" {
  secret_id = google_secret_manager_secret.firebase_sa.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# Common environment variables and secrets to be reused
locals {
  common_env = [
    { name = "NODE_ENV", value = "production" },
    { name = "FIREBASE_PROJECT_ID", value = var.firebase_project_id },
    { name = "CLOUD_RUN_SA_EMAIL", value = google_service_account.cloudrun_sa.email },
    { name = "GOOGLE_CLOUD_PROJECT", value = var.project_id },
    { name = "GOOGLE_CLOUD_REGION", value = var.region }
  ]
}

# Web Service (High Concurrency, 5m timeout)
resource "google_cloud_run_v2_service" "web" {
  name     = "nicheai-web"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun_sa.email
    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }
    max_instance_request_concurrency = 250
    timeout                          = "300s"

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/nicheai-app:latest"

      resources {
        limits = { cpu = "1000m", memory = "1024Mi" }
        startup_cpu_boost = true
        cpu_idle          = true
      }

      dynamic "env" {
        for_each = local.common_env
        content {
          name  = env.value.name
          value = env.value.value
        }
      }

      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "FIREBASE_SERVICE_ACCOUNT_BASE64"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.firebase_sa.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [google_artifact_registry_repository.repo]
}

# Worker Service (Low Concurrency, 30m timeout)
resource "google_cloud_run_v2_service" "worker" {
  name     = "nicheai-worker"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.cloudrun_sa.email
    scaling {
      min_instance_count = 0
      max_instance_count = var.max_instances
    }
    max_instance_request_concurrency = 4
    timeout                          = "1800s" # 30 minutes limit for heavy ML

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}/nicheai-app:latest"

      resources {
        limits = { cpu = "1000m", memory = "2048Mi" } # 2GB baseline memory
        startup_cpu_boost = true
        cpu_idle          = true
      }

      dynamic "env" {
        for_each = local.common_env
        content {
          name  = env.value.name
          value = env.value.value
        }
      }

      env {
        name = "GEMINI_API_KEY"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.gemini_api_key.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "FIREBASE_SERVICE_ACCOUNT_BASE64"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.firebase_sa.secret_id
            version = "latest"
          }
        }
      }
    }
  }

  depends_on = [google_artifact_registry_repository.repo]
}

# Allow public unauthenticated access to the Web service
resource "google_cloud_run_service_iam_member" "public_access" {
  location = google_cloud_run_v2_service.web.location
  project  = google_cloud_run_v2_service.web.project
  service  = google_cloud_run_v2_service.web.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Internal access for the Worker service (Invoker permissions for Service Account)
resource "google_cloud_run_service_iam_member" "worker_internal_access" {
  location = google_cloud_run_v2_service.worker.location
  project  = google_cloud_run_v2_service.worker.project
  service  = google_cloud_run_v2_service.worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# Grant Cloud Tasks Enqueuer role to the Service Account
resource "google_project_iam_member" "cloud_tasks_enqueuer" {
  project = var.project_id
  role    = "roles/cloudtasks.enqueuer"
  member  = "serviceAccount:${google_service_account.cloudrun_sa.email}"
}

# Example Cloud Tasks Queue with Bounded Concurrency
resource "google_cloud_tasks_queue" "vision_ml_queue" {
  name     = "vision-ml-queue"
  location = var.region

  rate_limits {
    max_concurrent_dispatches = 10
    max_dispatches_per_second = 5
  }

  retry_config {
    max_attempts       = 5
    max_retry_duration = "3600s" # 1h
    min_backoff        = "10s"
    max_backoff        = "300s"
    max_doublings      = 10
  }
}

# Tarpit Clustering Cron Job (Cloud Scheduler)
resource "google_cloud_scheduler_job" "tarpit_clustering" {
  name             = "tarpit-clustering-cron"
  description      = "Hourly Tarpit Clustering Sweep"
  schedule         = "0 * * * *"
  time_zone        = "Etc/UTC"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.worker.uri}/api/internal/cron/tarpit-clustering"
    
    oidc_token {
      service_account_email = google_service_account.cloudrun_sa.email
      audience              = google_cloud_run_v2_service.worker.uri
    }
  }
}

resource "google_cloud_scheduler_job" "taxonomy_merge" {
  name             = "taxonomy-merge-cron"
  description      = "Taxonomy Merge Polling"
  schedule         = "*/5 * * * *" # Every 5 minutes instead of 10s intervals
  time_zone        = "Etc/UTC"
  attempt_deadline = "320s"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.worker.uri}/api/internal/cron/taxonomy-merge"
    
    oidc_token {
      service_account_email = google_service_account.cloudrun_sa.email
      audience              = google_cloud_run_v2_service.worker.uri
    }
  }
}
