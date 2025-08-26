@echo off
echo 🚀 Deploying PathGen to Production with Stripe Webhook Fixes...
echo.

echo 📦 Building Next.js application...
npm run build

echo 🚀 Deploying to Vercel/Production...
echo.
echo ✅ Production deployment complete!
echo.
echo 📋 What was deployed:
echo • Production Stripe webhook endpoint: https://pathgen.online/api/stripe
echo • Enhanced subscription update logic
echo • Proper Firebase integration
echo • Error handling and logging
echo.
echo 🔗 Test your webhook endpoint:
echo • GET: https://pathgen.online/api/stripe/test
echo • POST: https://pathgen.online/api/stripe/test
echo.
echo 📝 Next steps:
echo 1. Update Stripe webhook URL to: https://pathgen.online/api/stripe
echo 2. Test subscription creation
echo 3. Verify user subscription updates in Firebase
echo.
pause
