@echo off
REM Firebase Deployment Script for PathGen (Windows)
REM This script deploys Firestore rules and indexes

echo 🚀 Deploying Firebase configuration for PathGen...

REM Check if Firebase CLI is installed
firebase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Firebase CLI is not installed. Please install it first:
    echo npm install -g firebase-tools
    pause
    exit /b 1
)

REM Check if user is logged in
firebase projects:list >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Not logged in to Firebase. Please login first:
    echo firebase login
    pause
    exit /b 1
)

echo ✅ Firebase CLI is ready

REM Deploy Firestore rules
echo 📋 Deploying Firestore security rules...
firebase deploy --only firestore:rules

if %errorlevel% equ 0 (
    echo ✅ Firestore rules deployed successfully
) else (
    echo ❌ Failed to deploy Firestore rules
    pause
    exit /b 1
)

REM Deploy Firestore indexes
echo 📊 Deploying Firestore indexes...
firebase deploy --only firestore:indexes

if %errorlevel% equ 0 (
    echo ✅ Firestore indexes deployed successfully
) else (
    echo ❌ Failed to deploy Firestore indexes
    pause
    exit /b 1
)

echo 🎉 Firebase deployment completed successfully!
echo.
echo Next steps:
echo 1. Verify your security rules in Firebase Console
echo 2. Check that indexes are building correctly
echo 3. Test your application with the new Firebase integration
echo.
echo For more information, see FIREBASE_SETUP.md
pause
