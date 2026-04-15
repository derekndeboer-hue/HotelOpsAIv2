resource "google_sql_database_instance" "hotel_ops" {
  name             = "hotel-ops-${var.environment}"
  database_version = "POSTGRES_15"
  region           = var.region

  settings {
    tier              = var.db_tier
    disk_size         = 10
    disk_type         = "PD_SSD"
    disk_autoresize   = true
    availability_type = var.environment == "production" ? "REGIONAL" : "ZONAL"

    backup_configuration {
      enabled                        = true
      start_time                     = "03:00"
      point_in_time_recovery_enabled = true
      transaction_log_retention_days = 7

      backup_retention_settings {
        retained_backups = 14
      }
    }

    ip_configuration {
      ipv4_enabled                                  = false
      private_network                               = google_compute_network.vpc.id
      enable_private_path_for_google_cloud_services = true
    }

    database_flags {
      name  = "log_checkpoints"
      value = "on"
    }

    database_flags {
      name  = "log_connections"
      value = "on"
    }

    user_labels = local.labels
  }

  deletion_protection = var.environment == "production" ? true : false
}

resource "google_sql_database" "hotel_ops" {
  name     = "hotel_ops"
  instance = google_sql_database_instance.hotel_ops.name
}

resource "google_sql_user" "hotel_ops" {
  name     = "hotel_ops_app"
  instance = google_sql_database_instance.hotel_ops.name
  password = data.google_secret_manager_secret_version.db_password.secret_data
}

data "google_secret_manager_secret_version" "db_password" {
  secret = google_secret_manager_secret.database_url.secret_id
}
