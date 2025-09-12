/**
 * Script to set up the initial 3 tracking links for PathGen
 * Run this once to create your default tracking links
 */

const links = [
  {
    name: "YouTube Campaign",
    code: "YOUTUBE"
  },
  {
    name: "Twitter/X Marketing", 
    code: "TWITTER"
  },
  {
    name: "Discord Communities",
    code: "DISCORD"
  }
];

async function setupTrackingLinks() {
  console.log('🔗 Setting up PathGen tracking links...');
  
  for (const link of links) {
    try {
      const response = await fetch('/api/admin/tracking-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(link)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Created: ${link.name}`);
        console.log(`   URL: ${result.link.url}`);
        console.log('');
      } else {
        console.log(`❌ Failed to create ${link.name}: ${result.error}`);
      }
    } catch (error) {
      console.log(`❌ Error creating ${link.name}:`, error);
    }
  }
  
  console.log('🎉 Setup complete! Your tracking links are ready.');
  console.log('📊 Visit /admin/tracking to see your dashboard.');
}

// Auto-run when this script is loaded in browser
if (typeof window !== 'undefined') {
  setupTrackingLinks();
}

module.exports = { setupTrackingLinks };
