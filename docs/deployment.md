# Deployment Guide

## Prerequisites

- Google Cloud SDK (`gcloud`) installed and authenticated
- Terraform >= 1.5.0
- Node.js >= 20
- Docker
- `gcloud` project configured: `gcloud config set project YOUR_PROJECT_ID`
- Required GCP APIs enabled:
  - Cloud Run
  - Cloud SQL Admin
  - Cloud Build
  - Artifact Registry
  - Firestore
  - Pub/Sub
  - Cloud Scheduler
  - Secret Manager
  - Compute Engine
  - VPC Access
  - Cloud Billing Budget

```bash
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  firestore.googleapis.com \
  pubsub.googleapis.com \
  cloudscheduler.googleapis.com \
  secretmanager.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com \
  billingbudgets.googleapis.com
```

## 1. Terraform Setup

### Create the state bucket

```bash
gsutil mb -l us-central1 gs://YOUR_PROJECT_ID-hotel-ops-terraform-state
gsutil versioning set on gs://YOUR_PROJECT_ID-hotel-ops-terraform-state
```

### Set secret values

Before running Terraform, populate Secret Manager secrets:

```bash
echo -n "postgresql://hotel_ops_app:PASSWORD@/hotel_ops?host=/cloudsql/CONNECTION_NAME" | \
  gcloud secrets versions add database-url --data-file=-

echo -n "$(openssl rand -base64 64)" | \
  gcloud secrets versions add jwt-secret --data-file=-

echo -n "$(openssl rand -base64 64)" | \
  gcloud secrets versions add jwt-refresh-secret --data-file=-
```

### Initialize and apply

```bash
cd infrastructure/terraform

terraform init

# Create a tfvars file
cat > terraform.tfvars <<EOF
project_id  = "your-project-id"
region      = "us-central1"
environment = "staging"
db_tier     = "db-f1-micro"
domain      = "hotel-ops.example.com"
EOF

terraform plan -out=tfplan
terraform apply tfplan
```

## 2. Database Migration

After Cloud SQL is provisioned, run migrations:

```bash
# Get the connection name from Terraform output
CONNECTION_NAME=$(terraform output -raw sql_connection_name)

# Start Cloud SQL proxy locally
cloud-sql-proxy --private-ip $CONNECTION_NAME &

# Run migrations
DATABASE_URL="postgresql://hotel_ops_app:PASSWORD@localhost:5432/hotel_ops" \
  npx prisma migrate deploy
```

## 3. Seed Data

```bash
DATABASE_URL="postgresql://hotel_ops_app:PASSWORD@localhost:5432/hotel_ops" \
  npm run db:seed
```

This creates the default admin user and base configuration.

## 4. Cloud Build Trigger

Set up the CI/CD trigger in Cloud Build:

```bash
gcloud builds triggers create github \
  --name="hotel-ops-main" \
  --repo-owner="YOUR_ORG" \
  --repo-name="hotel-ops" \
  --branch-pattern="^main$" \
  --build-config="infrastructure/cloudbuild.yaml" \
  --substitutions="_REGION=us-central1"
```

For staging (on PR merge to develop):

```bash
gcloud builds triggers create github \
  --name="hotel-ops-staging" \
  --repo-owner="YOUR_ORG" \
  --repo-name="hotel-ops" \
  --branch-pattern="^develop$" \
  --build-config="infrastructure/cloudbuild.yaml" \
  --substitutions="_REGION=us-central1"
```

## 5. First Deploy

Push to the configured branch to trigger Cloud Build, or run manually:

```bash
gcloud builds submit \
  --config=infrastructure/cloudbuild.yaml \
  --substitutions=SHORT_SHA=$(git rev-parse --short HEAD)
```

## 6. Deploy Firestore Rules

```bash
gcloud firestore deploy --rules=infrastructure/firestore.rules
```

## 7. DNS Configuration

Point your domain to the load balancer IP:

```bash
terraform output -raw lb_ip_address
```

Create an A record in your DNS provider pointing `hotel-ops.example.com` to this IP.

## 8. Verify

```bash
# Check API health
curl https://hotel-ops.example.com/api/health

# Check web frontend
curl -I https://hotel-ops.example.com/

# Verify Cloud Run services
gcloud run services list --region=us-central1 --filter="metadata.labels.project=hotel-ops"

# Check scheduler jobs
gcloud scheduler jobs list --location=us-central1
```

## Rollback

To roll back a Cloud Run deployment:

```bash
# List revisions
gcloud run revisions list --service=hotel-api --region=us-central1

# Route traffic to a previous revision
gcloud run services update-traffic hotel-api \
  --region=us-central1 \
  --to-revisions=hotel-api-REVISION=100
```

## Production Checklist

- [ ] `environment` set to `production` in terraform.tfvars
- [ ] `db_tier` upgraded from `db-f1-micro` to production tier
- [ ] SSL certificate provisioned and verified
- [ ] Budget alerts configured with correct email
- [ ] Monitoring notification channels verified
- [ ] Backup restoration tested
- [ ] Load testing completed
