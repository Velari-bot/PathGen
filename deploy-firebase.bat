@echo off
echo 🔥 Deploying Firebase Functions with Stripe Webhook Fixes...
echo.

echo 📦 Installing dependencies...
cd functions
npm install
cd ..

echo 🚀 Deploying functions...
firebase deploy --only functions

echo.
echo ✅ Deployment complete!
echo.
echo 📋 What was fixed:
echo • Added raw body configuration for Stripe webhooks
echo • Enhanced subscription update logic
echo • Added error handling for user document updates
echo • Improved payment success handling
echo.
echo 🔗 Your webhook endpoint: https://us-central1-pathgen-a771b.cloudfunctions.net/stripeWebhook
echo.
pause
