# Cloud Run deploy script
# Run from repo root after setting env vars in .env.local

$project = $env:GOOGLE_CLOUD_PROJECT_ID
$region = $env:GOOGLE_CLOUD_LOCATION -replace "us-central1", "us-central1"
if (-not $region) { $region = "us-central1" }
$service = "marketing-os"

Write-Host "Building Docker image..."
& gcloud builds submit --tag "gcr.io/$project/$service" .

Write-Host "Deploying to Cloud Run..."
& gcloud run deploy $service `
  --image "gcr.io/$project/$service" `
  --platform managed `
  --region $region `
  --allow-unauthenticated `
  --memory 512Mi `
  --cpu 1 `
  --min-instances 0 `
  --max-instances 5 `
  --set-env-vars "NEXT_PUBLIC_SUPABASE_URL=$env:NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY=$env:NEXT_PUBLIC_SUPABASE_ANON_KEY,SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY,GOOGLE_CLOUD_PROJECT_ID=$env:GOOGLE_CLOUD_PROJECT_ID,GOOGLE_CLOUD_LOCATION=$region,VERTEX_TEXT_MODEL=$env:VERTEX_TEXT_MODEL,VERTEX_IMAGE_MODEL=$env:VERTEX_IMAGE_MODEL,GOOGLE_APPLICATION_CREDENTIALS_JSON=$env:GOOGLE_APPLICATION_CREDENTIALS_JSON"

Write-Host ""
Write-Host "Deployed. URL:"
& gcloud run services describe $service --region $region --format "value(status.url)"
