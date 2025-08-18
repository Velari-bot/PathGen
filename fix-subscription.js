// Run this in your browser console while logged into PathGen
// This will fix your subscription status to allow dashboard access

console.log('🔧 Fixing subscription status...');

// Check if user is logged in
if (typeof user === 'undefined') {
  console.log('❌ User not logged in. Please log in first.');
} else {
  console.log('✅ User found:', user.uid);
  
  // Import Firebase functions
  import('firebase/firestore').then(({ doc, updateDoc, serverTimestamp }) => {
    import('@/lib/firebase').then(({ db }) => {
      // Update user document
      const userRef = doc(db, 'users', user.uid);
      
      updateDoc(userRef, {
        subscriptionStatus: 'active',
        subscriptionTier: 'free',
        updatedAt: serverTimestamp()
      }).then(() => {
        console.log('✅ Subscription status updated successfully!');
        console.log('📊 Subscription Status: active');
        console.log('🎯 Subscription Tier: free');
        console.log('🚀 You should now be able to access the dashboard!');
        console.log('🔄 Please refresh the page to see the changes.');
      }).catch((error) => {
        console.error('❌ Error updating subscription:', error);
      });
    }).catch((error) => {
      console.error('❌ Error importing Firebase:', error);
    });
  }).catch((error) => {
    console.error('❌ Error importing Firestore:', error);
  });
}

// Alternative: Manual Firebase Console Update
console.log('\n📝 If the above doesn\'t work, manually update in Firebase Console:');
console.log('1. Go to Firebase Console → Firestore Database');
console.log('2. Find your user document in the "users" collection');
console.log('3. Edit the document and change:');
console.log('   - subscriptionStatus: "inactive" → "active"');
console.log('   - subscriptionTier: null → "free"');
console.log('4. Save the changes');
console.log('5. Refresh your PathGen dashboard');
