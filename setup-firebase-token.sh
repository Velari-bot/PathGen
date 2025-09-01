#!/bin/bash

echo "🔧 Setting up Firebase token for GitHub Actions"
echo "=============================================="

# Check if firebase-tools is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Installing..."
    npm install -g firebase-tools
fi

echo "📝 Please follow these steps:"
echo "1. Run: firebase login:ci"
echo "2. Copy the token that appears"
echo "3. Go to your GitHub repository settings"
echo "4. Go to Secrets and variables > Actions"
echo "5. Create a new secret called 'FIREBASE_TOKEN'"
echo "6. Paste the token as the value"
echo ""
echo "🚀 After setting up the token, your GitHub Actions will work!"

# Try to get the token automatically
echo "🔄 Attempting to get Firebase token automatically..."
firebase login:ci --no-localhost
