# Web static hosting bucket
resource "google_storage_bucket" "web" {
  name     = "${var.project_id}-hotel-ops-web"
  location = var.region
  labels   = local.labels

  uniform_bucket_level_access = true

  website {
    main_page_suffix = "index.html"
    not_found_page   = "index.html"
  }

  cors {
    origin          = ["https://${var.domain}"]
    method          = ["GET", "HEAD"]
    response_header = ["Content-Type"]
    max_age_seconds = 3600
  }
}

resource "google_storage_bucket_iam_member" "web_public" {
  bucket = google_storage_bucket.web.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# Uploads bucket (photos)
resource "google_storage_bucket" "uploads" {
  name     = "${var.project_id}-hotel-ops-uploads"
  location = var.region
  labels   = local.labels

  uniform_bucket_level_access = true

  cors {
    origin          = ["https://${var.domain}"]
    method          = ["GET", "HEAD", "PUT", "POST"]
    response_header = ["Content-Type", "Content-Length", "Content-Disposition"]
    max_age_seconds = 3600
  }
}

# Reports bucket with 90-day lifecycle
resource "google_storage_bucket" "reports" {
  name     = "${var.project_id}-hotel-ops-reports"
  location = var.region
  labels   = local.labels

  uniform_bucket_level_access = true

  lifecycle_rule {
    condition {
      age = 90
    }
    action {
      type = "Delete"
    }
  }
}

# Backups bucket
resource "google_storage_bucket" "backups" {
  name     = "${var.project_id}-hotel-ops-backups"
  location = var.region
  labels   = local.labels

  uniform_bucket_level_access = true

  versioning {
    enabled = true
  }

  lifecycle_rule {
    condition {
      age = 365
    }
    action {
      type = "Delete"
    }
  }
}
