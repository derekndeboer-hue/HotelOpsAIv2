output "api_url" {
  description = "Hotel API Cloud Run service URL"
  value       = google_cloud_run_v2_service.hotel_api.uri
}

output "web_url" {
  description = "Web application URL (empty until domain is configured)"
  value       = var.domain != "" ? "https://${var.domain}" : ""
}

output "sql_connection_name" {
  description = "Cloud SQL instance connection name"
  value       = google_sql_database_instance.hotel_ops.connection_name
}
