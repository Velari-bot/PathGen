# PathGen AI 🎯

A comprehensive Fortnite player improvement platform powered by AI coaching and personalized strategies.

## ✨ Features

- **AI-Powered Coaching**: Get personalized Fortnite strategies using OpenAI GPT-4
- **Fortnite Stats Integration**: Connect your Epic account to get real-time stats and personalized insights
- **Interactive Chat Interface**: ChatGPT-style interface with conversation history and chat logs
- **Payment-Gated Dashboard**: Premium features accessible through Stripe subscription
- **Responsive Design**: Modern, dark-themed UI with smooth animations using GSAP and Lenis
- **User Authentication**: Secure login/signup with Firebase Auth
- **Real-time Data**: Live Fortnite stats and match history via Fortnite Tracker API

## 🚀 Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom animations
- **Animations**: GSAP ScrollTrigger, Lenis smooth scrolling
- **Backend**: Next.js API Routes
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth (Email, Google OAuth)
- **AI**: OpenAI GPT-4o-mini
- **Payments**: Stripe subscriptions
- **APIs**: Fortnite Tracker API, Epic Games OAuth
- **Deployment**: Vercel-ready

## 🎮 Core Features

### AI Coaching
- Personalized strategies based on your Fortnite stats
- Real-time coaching during gameplay
- Historical chat logs with 5-conversation limit
- 30-day conversation retention

### Fortnite Integration
- Epic Account linking via OAuth
- Real-time KD, win rate, and match statistics
- Preferred drop locations and weakest zones analysis
- Recent match history and performance trends

### Dashboard
- Overview of your Fortnite performance
- AI insights and improvement suggestions
- Usage analytics and progress tracking
- Quick access to AI coaching

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Stripe account
- OpenAI API key
- Fortnite Tracker API key
- Epic Games Developer account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd PathGen
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_publishable_key
   
   # Base URL
   NEXT_PUBLIC_BASE_URL=http://localhost:3000
   
   # Fortnite Tracker
   FORTNITE_TRACKER_KEY=your_fortnite_tracker_key
   
   # Epic Games OAuth
   EPIC_CLIENT_ID=your_epic_client_id
   EPIC_CLIENT_SECRET=your_epic_client_secret
   EPIC_REDIRECT_URI=http://localhost:3000/api/epic/oauth-callback
   NEXT_PUBLIC_EPIC_CLIENT_ID=your_epic_client_id
   NEXT_PUBLIC_EPIC_REDIRECT_URI=http://localhost:3000/api/epic/oauth-callback
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Firebase Setup
1. Create a new Firebase project
2. Enable Authentication (Email/Password, Google)
3. Create a Firestore database
4. Update security rules for development:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

### Stripe Setup
1. Create a Stripe account
2. Create a product with recurring pricing
3. Set up webhook endpoint: `/api/webhooks/stripe`
4. Update the Price ID in `/src/app/pricing/page.tsx`

### Epic Games OAuth
1. Go to [Epic Games Developer Portal](https://dev.epicgames.com/)
2. Create a new product
3. Configure OAuth client with redirect URI
4. Get Client ID and Client Secret

## 📱 Usage

### For Users
1. **Sign Up/Login**: Create an account or sign in with Google
2. **Subscribe**: Choose a plan to unlock full features
3. **Link Epic Account**: Connect your Fortnite account for personalized coaching
4. **Get AI Coaching**: Ask questions and receive personalized strategies
5. **Track Progress**: Monitor your improvement through the dashboard

### For Developers
- All API routes are in `/src/app/api/`
- Components are in `/src/components/`
- Types are defined in `/src/types/index.ts`
- Services are in `/src/lib/`

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment
1. Build the project: `npm run build`
2. Start production server: `npm start`
3. Set production environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Fortnite Tracker API for player statistics
- Epic Games for OAuth integration
- OpenAI for AI coaching capabilities
- Stripe for payment processing
- Firebase for backend services

## 📞 Support

For support, email support@pathgen.ai or create an issue in this repository.

---

**Built with ❤️ for the Fortnite community**
