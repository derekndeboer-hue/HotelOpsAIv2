# Topics

resource "google_pubsub_topic" "room_status_changes" {
  name   = "room-status-changes"
  labels = local.labels

  message_retention_duration = "86400s"
}

resource "google_pubsub_topic" "work_order_updates" {
  name   = "work-order-updates"
  labels = local.labels

  message_retention_duration = "86400s"
}

resource "google_pubsub_topic" "schedule_updates" {
  name   = "schedule-updates"
  labels = local.labels

  message_retention_duration = "86400s"
}

resource "google_pubsub_topic" "notification_events" {
  name   = "notification-events"
  labels = local.labels

  message_retention_duration = "86400s"
}

resource "google_pubsub_topic" "report_requests" {
  name   = "report-requests"
  labels = local.labels

  message_retention_duration = "86400s"
}

# Push subscriptions

resource "google_pubsub_subscription" "room_status_to_realtime" {
  name  = "room-status-to-realtime-sync"
  topic = google_pubsub_topic.room_status_changes.id

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.realtime_sync.uri}/pubsub/room-status"

    oidc_token {
      service_account_email = google_service_account.pubsub_invoker.email
    }
  }

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s"
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "work_order_to_realtime" {
  name  = "work-order-to-realtime-sync"
  topic = google_pubsub_topic.work_order_updates.id

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.realtime_sync.uri}/pubsub/work-orders"

    oidc_token {
      service_account_email = google_service_account.pubsub_invoker.email
    }
  }

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s"
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "schedule_to_realtime" {
  name  = "schedule-to-realtime-sync"
  topic = google_pubsub_topic.schedule_updates.id

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.realtime_sync.uri}/pubsub/schedules"

    oidc_token {
      service_account_email = google_service_account.pubsub_invoker.email
    }
  }

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s"
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "notification_to_realtime" {
  name  = "notification-to-realtime-sync"
  topic = google_pubsub_topic.notification_events.id

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.realtime_sync.uri}/pubsub/notifications"

    oidc_token {
      service_account_email = google_service_account.pubsub_invoker.email
    }
  }

  ack_deadline_seconds       = 30
  message_retention_duration = "604800s"
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

resource "google_pubsub_subscription" "report_to_worker" {
  name  = "report-to-report-worker"
  topic = google_pubsub_topic.report_requests.id

  push_config {
    push_endpoint = "${google_cloud_run_v2_service.report_worker.uri}/pubsub/reports"

    oidc_token {
      service_account_email = google_service_account.pubsub_invoker.email
    }
  }

  ack_deadline_seconds       = 120
  message_retention_duration = "604800s"
  retry_policy {
    minimum_backoff = "10s"
    maximum_backoff = "600s"
  }
}

# Pub/Sub invoker service account

resource "google_service_account" "pubsub_invoker" {
  account_id   = "hotel-ops-pubsub-invoker"
  display_name = "Hotel Ops Pub/Sub Invoker"
}

resource "google_cloud_run_v2_service_iam_member" "realtime_pubsub_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.realtime_sync.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.pubsub_invoker.email}"
}

resource "google_cloud_run_v2_service_iam_member" "report_pubsub_invoker" {
  project  = var.project_id
  location = var.region
  name     = google_cloud_run_v2_service.report_worker.name
  role     = "roles/run.invoker"
  member   = "serviceAccount:${google_service_account.pubsub_invoker.email}"
}
