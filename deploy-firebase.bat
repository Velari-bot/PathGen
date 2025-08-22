@echo off
echo 🚀 Deploying Firebase configuration...
echo.

echo 📋 Deploying Firestore security rules...
firebase deploy --only firestore:rules

echo.
echo 📊 Deploying Firestore indexes...
firebase deploy --only firestore:indexes

echo.
echo ✅ Firebase deployment complete!
echo.
echo 📝 Next steps:
echo 1. Check Firebase Console to verify rules are active
echo 2. Test the chat functionality
echo 3. Messages should now save to Firebase
echo.
pause
