output "cloud_run_url" {
  description = "The public URL of the deployed Cloud Run service."
  value       = google_cloud_run_v2_service.app.uri
}

output "artifact_registry_repo" {
  description = "The Artifact Registry Docker repository path."
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}
