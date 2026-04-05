variable "project_id" {
  type        = string
  description = "The Google Cloud Project ID where resources will be deployed"
}

variable "region" {
  type        = string
  description = "The GCP region to deploy to (e.g., us-central1)"
  default     = "us-central1"
}

variable "max_instances" {
  type        = number
  description = "The maximum number of Cloud Run instances to prevent unexpected billing spikes"
  default     = 5
}

# Sensitive Environment Variables
variable "gemini_api_key" {
  type        = string
  description = "Google GenAI API Key"
  sensitive   = true
}

variable "firebase_project_id" {
  type        = string
  description = "Firebase Project ID"
  sensitive   = true
  default     = ""
}

variable "firebase_service_account_base64" {
  type        = string
  description = "Base64 encoded Firebase Service Account JSON"
  sensitive   = true
  default     = ""
}

variable "database_url" {
  type        = string
  description = "Serverless Database Connection String (e.g., Neon or Turso)"
  sensitive   = true
  default     = ""
}

variable "redis_url" {
  type        = string
  description = "Redis Connection String for BullMQ"
  sensitive   = true
  default     = ""
}

variable "image" {
  type        = string
  description = "Docker image URL to deploy"
}
