resource "google_compute_network" "vpc" {
  name                    = "hotel-ops-vpc"
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "main" {
  name          = "hotel-ops-subnet"
  ip_cidr_range = "10.0.0.0/20"
  region        = var.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true
}

resource "google_compute_subnetwork" "serverless" {
  name          = "hotel-ops-serverless-subnet"
  ip_cidr_range = "10.8.0.0/28"
  region        = var.region
  network       = google_compute_network.vpc.id

  private_ip_google_access = true
}

resource "google_vpc_access_connector" "serverless_connector" {
  name   = "hotel-ops-connector"
  region = var.region

  subnet {
    name = google_compute_subnetwork.serverless.name
  }

  machine_type  = "e2-micro"
  min_instances = 2
  max_instances = 3
}

resource "google_compute_global_address" "private_ip" {
  name          = "hotel-ops-private-ip"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = google_compute_network.vpc.id
}

resource "google_service_networking_connection" "private_vpc" {
  network                 = google_compute_network.vpc.id
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip.name]
}

# Firewall rules

resource "google_compute_firewall" "allow_health_checks" {
  name    = "hotel-ops-allow-health-checks"
  network = google_compute_network.vpc.name

  allow {
    protocol = "tcp"
    ports    = ["8080"]
  }

  source_ranges = [
    "130.211.0.0/22",
    "35.191.0.0/16",
  ]

  target_tags = ["hotel-ops"]
}

resource "google_compute_firewall" "deny_all_ingress" {
  name     = "hotel-ops-deny-all-ingress"
  network  = google_compute_network.vpc.name
  priority = 65534

  deny {
    protocol = "all"
  }

  source_ranges = ["0.0.0.0/0"]
}
