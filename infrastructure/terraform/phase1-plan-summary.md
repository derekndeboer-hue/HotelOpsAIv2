# HotelOpsAI Phase 1 — Terraform Plan Summary
**Date:** 2026-04-15  
**Plan file:** `phase1.tfplan`  
**Result:** SUCCESS — 51 resources to add, 0 to change, 0 to destroy

---

## What Was Found

The scaffold was a well-structured single-module flat layout covering all Phase 1 services. The backend block pointed at a non-existent bucket (`hotel-ops-terraform-state`), `domain` had no default, and Artifact Registry was referenced in Cloud Run image paths but had no corresponding `google_artifact_registry_repository` resource.

---

## Domain / LB Wrinkle — How It Was Handled

**Approach chosen:** `default = ""` on `var.domain` + `count = var.domain != "" ? 1 : 0` on every domain-dependent resource.

**Files edited:**

**`variables.tf`** — Added `default = ""` to the `domain` variable.

**`load-balancer.tf`** — Added `locals { lb_enabled = var.domain != "" ? 1 : 0 }` and applied `count = local.lb_enabled` to all 11 resources in the file. Internal `[0]` index references added wherever one counted resource references another (e.g., `google_compute_url_map.hotel_ops[0].id`).

**`monitoring.tf`** — Added `locals { monitoring_domain_enabled = ... }` and applied `count = local.monitoring_domain_enabled` to the uptime check, notification channel, and the three alert policies (all reference the channel). `google_billing_budget` stays unconditional but its `monitoring_notification_channels` is now conditionally empty (`[]`) rather than a hard reference.

**`outputs.tf`** — `web_url` output changed to ternary: `var.domain != "" ? "https://${var.domain}" : ""`. Plan output confirms `web_url = ""` as expected.

**`cloud-storage.tf`** — CORS origin renders as `"https://"` with empty domain. This does NOT block plan or apply; it just means no CORS is effectively allowed on the web/uploads buckets until domain is set. Acceptable for staging.

---

## State Bucket

Created: `gs://hotelopsai-prod-tfstate` (us-central1, uniform bucket-level access, versioning enabled)  
`main.tf` backend block updated from `hotel-ops-terraform-state` → `hotelopsai-prod-tfstate`.  
`terraform init` ran successfully against this bucket.

---

## New File Added

**`artifact-registry.tf`** — Added `google_artifact_registry_repository.hotel_ops` (DOCKER format, `hotel-ops` repo in us-central1) and IAM binding granting the Cloud Run service account `roles/artifactregistry.reader`. Without this, Cloud Run would fail to pull images on first deploy.

---

## Resources That Would Be Created (51 total)

| Type | Resources |
|------|-----------|
| Artifact Registry | repository (hotel-ops), IAM member (cloud_run reader) |
| Billing | budget ($100 with 50/75/100% alerts) |
| Cloud Run (services) | hotel-api, realtime-sync, report-worker |
| Cloud Run (IAM) | api_public (allUsers invoker), realtime_pubsub_invoker, report_pubsub_invoker, scheduler_invoker |
| Cloud Scheduler | daily_schedule_gen, weekly_digest, compliance_check |
| Compute (VPC/networking) | vpc, subnet-main, subnet-serverless, vpc_access_connector, global_address (private_ip), service_networking_connection |
| Compute (firewall) | allow_health_checks, deny_all_ingress |
| Firestore | database (default, native mode), project_service enablement |
| IAM (project-level) | cloud_run_sql, cloud_run_secret, cloud_run_firestore, cloud_run_pubsub |
| Pub/Sub (topics) | room-status-changes, work-order-updates, schedule-updates, notification-events, report-requests |
| Pub/Sub (subscriptions) | room_status_to_realtime, work_order_to_realtime, schedule_to_realtime, notification_to_realtime, report_to_worker |
| Secret Manager | database-url, jwt-secret, jwt-refresh-secret |
| Service Accounts | cloud_run_sa, pubsub_invoker, scheduler_sa |
| Cloud SQL | instance (hotel-ops-staging, db-f1-micro, Postgres 15), database, user |
| Storage (buckets) | web, uploads, reports, backups |
| Storage (IAM) | web_public (allUsers objectViewer) |

**Deferred (count = 0 until domain set):**
- All 11 load balancer resources (SSL cert, static IP, NEGs, backend service/bucket, URL maps, proxies, forwarding rules)
- Uptime check, notification channel, 3 alert policies

---

## Items Sasha Needs to Decide Before Apply

1. **Secret values.** `database-url`, `jwt-secret`, `jwt-refresh-secret` will be created as empty shells. Terraform will then try to read `database-url` as a data source to populate the Cloud SQL user password — this will fail on apply unless a secret version is added manually (or via a `null_resource`/`terraform_data` provisioner) before the SQL user resource runs. Recommend: apply in two passes (secrets first, then everything else) or seed secrets via `gcloud secrets versions add` immediately after the first partial apply.

2. **`servicenetworking.googleapis.com`** is not in the confirmed-enabled API list. Cloud SQL private IP requires it. It will be enabled implicitly via `google_service_networking_connection` but that API sometimes takes 2–3 minutes to propagate and can cause a first-apply race. Worth manually enabling before apply: `gcloud services enable servicenetworking.googleapis.com`.

3. **Cloud Run image cold start.** The three Cloud Run services reference `:latest` tags in the Artifact Registry repo. The repo will exist after apply, but no images will be pushed yet — Cloud Run service creation will succeed (it defers the actual container pull) but the services will be in an error state until images are pushed.

4. **CORS on storage buckets.** Web and uploads buckets will deploy with `origin = ["https://"]` (empty domain interpolation). Fine for staging — just note that CORS won't function properly until domain is set and `terraform apply` is re-run.

5. **Budget notification channel.** The billing budget will create with an empty notification channel list. Budget alerts will still fire to the billing account owner's email by default via GCP, but the custom `alerts@domain` channel won't exist until domain is set.

---

## Files Changed

| File | Change |
|------|--------|
| `variables.tf` | Added `default = ""` to `domain` variable |
| `load-balancer.tf` | Full rewrite — all 11 resources gated on `local.lb_enabled` |
| `monitoring.tf` | All domain-dependent resources gated on `local.monitoring_domain_enabled`; budget channel reference made conditional |
| `outputs.tf` | `web_url` output changed to ternary to avoid empty-domain interpolation |
| `main.tf` | Backend bucket name corrected to `hotelopsai-prod-tfstate` |
| `terraform.tfvars` | Created (new file) |
| `artifact-registry.tf` | Created (new file) — missing resource added |
