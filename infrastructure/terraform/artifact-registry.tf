resource "google_artifact_registry_repository" "hotel_ops" {
  location      = var.region
  repository_id = "hotel-ops"
  format        = "DOCKER"
  labels        = local.labels
}

resource "google_artifact_registry_repository_iam_member" "cloud_run_reader" {
  location   = google_artifact_registry_repository.hotel_ops.location
  repository = google_artifact_registry_repository.hotel_ops.name
  role       = "roles/artifactregistry.reader"
  member     = "serviceAccount:${google_service_account.cloud_run_sa.email}"
}
