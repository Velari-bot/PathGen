# PathGen Credit Backend System

A comprehensive Node.js backend system for tracking user credits in the PathGen AI application, featuring Firebase Firestore integration and Stripe subscription management.

## 🚀 Features

- **User Management**: Initialize Free (250 credits) and Pro (4000 credits) users
- **Credit Operations**: Deduct, add, and check credits with transaction history
- **Stripe Integration**: Automatic subscription handling and credit top-ups
- **Transaction History**: Complete audit trail of all credit operations
- **Scalable Architecture**: Designed to handle thousands of users
- **RESTful API**: Clean API endpoints for all operations
- **Webhook Support**: Real-time Stripe event processing

## 📋 Requirements

- Node.js 18.0.0 or higher
- Firebase project with Firestore enabled
- Stripe account with webhook configuration
- TypeScript support

## 🛠️ Installation

1. **Clone and setup**:
```bash
# Copy the credit backend files to your project
cp src/lib/credit-backend-service.ts src/lib/
cp src/lib/stripe-webhook-handler.ts src/lib/
cp src/lib/credit-api-endpoints.ts src/lib/
cp src/server.ts src/
cp package-credit-backend.json package.json
cp tsconfig-credit-backend.json tsconfig.json
cp env-credit-backend.example .env
```

2. **Install dependencies**:
```bash
npm install express cors helmet express-rate-limit stripe firebase-admin dotenv
npm install -D @types/express @types/cors @types/node typescript ts-node eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser jest @types/jest
```

3. **Configure environment variables**:
```bash
# Copy and edit the environment file
cp env-credit-backend.example .env
# Edit .env with your actual values
```

4. **Build and run**:
```bash
# Development
npm run dev

# Production
npm run build
npm start
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=service-account@project.iam.gserviceaccount.com

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# CORS
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Firebase Setup

1. Create a Firebase project
2. Enable Firestore Database
3. Create a service account and download the JSON key
4. Add the service account credentials to your environment variables

### Stripe Setup

1. Create a Stripe account
2. Get your API keys from the dashboard
3. Set up webhook endpoints pointing to your server
4. Configure webhook events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 📊 Database Schema

### Users Collection

```typescript
interface UserDocument {
  userId: string;
  name: string;
  email: string;
  accountType: 'free' | 'pro';
  credits: number;
  transactionHistory: TransactionRecord[];
  createdAt: Date;
  updatedAt: Date;
  subscriptionId?: string;
  stripeCustomerId?: string;
}

interface TransactionRecord {
  timestamp: Date;
  action: 'initialization' | 'deduction' | 'addition' | 'subscription_upgrade' | 'manual_topup' | 'refund' | 'subscription_renewal';
  creditsChanged: number;
  creditsBefore: number;
  creditsAfter: number;
  metadata?: {
    feature?: string;
    subscriptionId?: string;
    reason?: string;
    [key: string]: any;
  };
}
```

## 🔌 API Endpoints

### User Management

- `GET /api/user/:userId` - Get user credits and info
- `POST /api/user/:userId/initialize` - Initialize new user
- `POST /api/user/:userId/upgrade-to-pro` - Manual Pro upgrade

### Credit Operations

- `POST /api/user/:userId/deduct` - Deduct credits
- `POST /api/user/:userId/add` - Add credits
- `POST /api/user/:userId/check-credits` - Check if user has enough credits
- `GET /api/user/:userId/history` - Get transaction history

### Webhooks

- `POST /webhook/stripe` - Stripe webhook endpoint

### Health Check

- `GET /api/health` - Server health check

## 📝 API Usage Examples

### Initialize a Free User

```bash
curl -X POST http://localhost:3000/api/user/user123/initialize \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "accountType": "free"
  }'
```

### Deduct Credits

```bash
curl -X POST http://localhost:3000/api/user/user123/deduct \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10,
    "feature": "ai_chat",
    "metadata": {
      "messageType": "user_message"
    }
  }'
```

### Check Credits

```bash
curl -X POST http://localhost:3000/api/user/user123/check-credits \
  -H "Content-Type: application/json" \
  -d '{
    "requiredAmount": 5
  }'
```

### Get Transaction History

```bash
curl http://localhost:3000/api/user/user123/history?limit=20
```

## 🔄 Stripe Webhook Events

The system automatically handles these Stripe events:

- **Subscription Created**: Creates new Pro user or upgrades existing user
- **Subscription Updated**: Handles status changes (active/canceled)
- **Subscription Deleted**: Downgrades user to Free
- **Invoice Payment Succeeded**: Adds monthly Pro credits (4000)

## 🧪 Testing

```bash
# Run tests
npm test

# Test specific endpoint
curl http://localhost:3000/api/health
```

## 📈 Scaling Considerations

- **Firestore**: Automatically scales to handle millions of users
- **Rate Limiting**: Built-in protection against abuse
- **Transaction Safety**: Uses Firestore transactions for data consistency
- **Error Handling**: Comprehensive error handling and logging
- **Caching**: Consider adding Redis for frequently accessed data

## 🔒 Security Features

- **Helmet**: Security headers
- **CORS**: Configurable cross-origin requests
- **Rate Limiting**: Prevents API abuse
- **Input Validation**: All inputs are validated
- **Webhook Verification**: Stripe signature verification

## 🚨 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "creditsRemaining": 0
}
```

## 📚 Integration with Frontend

```typescript
// Example frontend integration
class CreditService {
  private baseUrl = 'http://localhost:3000/api';
  
  async deductCredits(userId: string, amount: number, feature: string) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/deduct`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, feature })
    });
    return response.json();
  }
  
  async checkCredits(userId: string, requiredAmount: number) {
    const response = await fetch(`${this.baseUrl}/user/${userId}/check-credits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requiredAmount })
    });
    return response.json();
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Firebase Connection**: Check service account credentials
2. **Stripe Webhooks**: Verify webhook secret and endpoint URL
3. **CORS Errors**: Update ALLOWED_ORIGINS in environment
4. **Rate Limiting**: Adjust limits in server configuration

### Logs

Check console logs for detailed error information and transaction records.

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📞 Support

For support, please contact the PathGen development team or create an issue in the repository.
