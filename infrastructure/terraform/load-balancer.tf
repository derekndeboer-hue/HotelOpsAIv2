# Managed SSL certificate
resource "google_compute_managed_ssl_certificate" "hotel_ops" {
  name = "hotel-ops-ssl-cert"

  managed {
    domains = [var.domain]
  }
}

# Static IP
resource "google_compute_global_address" "hotel_ops" {
  name = "hotel-ops-lb-ip"
}

# Backend bucket for web (CDN enabled)
resource "google_compute_backend_bucket" "web" {
  name        = "hotel-ops-web-backend"
  bucket_name = google_storage_bucket.web.name
  enable_cdn  = true

  cdn_policy {
    cache_mode                   = "CACHE_ALL_STATIC"
    default_ttl                  = 3600
    max_ttl                      = 86400
    signed_url_cache_max_age_sec = 0
  }
}

# Serverless NEG for Cloud Run API
resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "hotel-ops-api-neg"
  region                = var.region
  network_endpoint_type = "SERVERLESS"

  cloud_run {
    service = google_cloud_run_v2_service.hotel_api.name
  }
}

# Backend service for API
resource "google_compute_backend_service" "api" {
  name                  = "hotel-ops-api-backend"
  protocol              = "HTTPS"
  load_balancing_scheme = "EXTERNAL_MANAGED"

  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }

  log_config {
    enable      = true
    sample_rate = 1.0
  }
}

# URL map
resource "google_compute_url_map" "hotel_ops" {
  name            = "hotel-ops-url-map"
  default_service = google_compute_backend_bucket.web.id

  host_rule {
    hosts        = [var.domain]
    path_matcher = "hotel-ops-paths"
  }

  path_matcher {
    name            = "hotel-ops-paths"
    default_service = google_compute_backend_bucket.web.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }
  }
}

# HTTPS proxy
resource "google_compute_target_https_proxy" "hotel_ops" {
  name             = "hotel-ops-https-proxy"
  url_map          = google_compute_url_map.hotel_ops.id
  ssl_certificates = [google_compute_managed_ssl_certificate.hotel_ops.id]
}

# Forwarding rule
resource "google_compute_global_forwarding_rule" "hotel_ops" {
  name                  = "hotel-ops-https-forwarding"
  target                = google_compute_target_https_proxy.hotel_ops.id
  port_range            = "443"
  ip_address            = google_compute_global_address.hotel_ops.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}

# HTTP to HTTPS redirect
resource "google_compute_url_map" "http_redirect" {
  name = "hotel-ops-http-redirect"

  default_url_redirect {
    https_redirect = true
    strip_query    = false
  }
}

resource "google_compute_target_http_proxy" "http_redirect" {
  name    = "hotel-ops-http-redirect-proxy"
  url_map = google_compute_url_map.http_redirect.id
}

resource "google_compute_global_forwarding_rule" "http_redirect" {
  name                  = "hotel-ops-http-redirect-forwarding"
  target                = google_compute_target_http_proxy.http_redirect.id
  port_range            = "80"
  ip_address            = google_compute_global_address.hotel_ops.address
  load_balancing_scheme = "EXTERNAL_MANAGED"
}
