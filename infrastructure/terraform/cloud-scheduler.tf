resource "google_cloud_scheduler_job" "daily_schedule_gen" {
  name        = "hotel-ops-daily-schedule-gen"
  description = "Generate daily staff schedules at 3pm"
  schedule    = "0 15 * * *"
  time_zone   = "America/New_York"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.hotel_api.uri}/api/schedules/generate"

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "300s"
  }
}

resource "google_cloud_scheduler_job" "weekly_digest" {
  name        = "hotel-ops-weekly-digest"
  description = "Send weekly operations digest every Monday at 6am"
  schedule    = "0 6 * * 1"
  time_zone   = "America/New_York"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.hotel_api.uri}/api/reports/weekly-digest"

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "300s"
  }
}

resource "google_cloud_scheduler_job" "compliance_check" {
  name        = "hotel-ops-compliance-check"
  description = "Run daily compliance checks at 8am"
  schedule    = "0 8 * * *"
  time_zone   = "America/New_York"

  http_target {
    http_method = "POST"
    uri         = "${google_cloud_run_v2_service.hotel_api.uri}/api/compliance/check"

    oidc_token {
      service_account_email = google_service_account.scheduler_sa.email
    }
  }

  retry_config {
    retry_count          = 3
    min_backoff_duration = "5s"
    max_backoff_duration = "300s"
  }
}

resource "google_service_account" "scheduler_sa" {
  account_id   = "hotel-ops-scheduler"
  display_name = "Hotel Ops Cloud Scheduler"
}

resource "google_cloud_run_v2_service_iam_member" "scheduler_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.hotel_api.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.scheduler_sa.email}"
}
