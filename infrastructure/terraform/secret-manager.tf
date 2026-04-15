resource "google_secret_manager_secret" "database_url" {
  secret_id = "database-url"
  labels    = local.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "jwt-secret"
  labels    = local.labels

  replication {
    auto {}
  }
}

resource "google_secret_manager_secret" "jwt_refresh_secret" {
  secret_id = "jwt-refresh-secret"
  labels    = local.labels

  replication {
    auto {}
  }
}
