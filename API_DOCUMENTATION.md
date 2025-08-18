# 🚀 PathGen API Documentation

## Overview
PathGen provides a comprehensive set of APIs for Fortnite player improvement, Epic Games integration, AI coaching, and subscription management.

## 🔗 Base URL
```
http://localhost:3000/api (development)
https://yourdomain.com/api (production)
```

## 📊 Health Check
### GET `/api/health`
Check the status of all APIs and system health.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-15T15:16:37.935Z",
  "version": "1.0.0",
  "apis": { ... },
  "environment": { ... },
  "system": { ... }
}
```

---

## 🎨 Placeholder Images
### GET `/api/placeholder`
Generate SVG placeholder images on-demand.

**Query Parameters:**
- `width` (number): Image width (max: 2000)
- `height` (number): Image height (max: 2000)
- `bgColor` (string): Background color hex code (default: 4A90E2)
- `textColor` (string): Text color hex code (default: FFFFFF)
- `text` (string): Text to display (default: "Image")

**Example:**
```
/api/placeholder?width=400&height=200&bgColor=FF0000&text=Hello+World
```

**Response:** SVG image with proper headers

---

## 🤖 AI & Chat
### POST `/api/chat`
AI-powered chat system using OpenAI.

**Request Body:**
```json
{
  "message": "How can I improve my building?",
  "context": "You are a Fortnite coach...",
  "fortniteUsername": "Player123",
  "epicContext": "Epic account info...",
  "userStats": "Player statistics..."
}
```

**Response:**
```json
{
  "response": "AI-generated response..."
}
```

### POST `/api/ai/create-conversation`
Create new AI coaching conversations.

**Request Body:**
```json
{
  "conversation": {
    "id": "conv-123",
    "userId": "user-456",
    "epicName": "Player123",
    "title": "Coaching Session"
  },
  "userId": "user-456"
}
```

**Response:**
```json
{
  "success": true,
  "conversation": { ... },
  "welcomeMessage": { ... },
  "usage": { ... }
}
```

---

## 🎮 Epic Games Integration
### POST `/api/epic/oauth-callback`
Handle Epic Games OAuth authentication.

**Request Body:**
```json
{
  "code": "authorization_code",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "epicAccount": {
    "epicId": "epic-123",
    "displayName": "Player123",
    "platform": "pc"
  }
}
```

### POST `/api/epic/verify-account`
Manually verify Epic account.

**Request Body:**
```json
{
  "epicUsername": "Player123",
  "userId": "user-123"
}
```

**Response:**
```json
{
  "success": true,
  "epicAccount": {
    "epicUsername": "Player123",
    "epicId": "epic-456",
    "stats": { ... }
  }
}
```

---

## 👤 User Management
### POST `/api/user/link-epic-account`
Link Epic account to user profile.

**Request Body:**
```json
{
  "epicAccount": {
    "epicId": "epic-123",
    "displayName": "Player123"
  },
  "userId": "user-456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Epic account linked successfully"
}
```

### GET `/api/user/get-epic-account?userId=user-123`
Get user's linked Epic account.

**Response:**
```json
{
  "success": true,
  "epicAccount": {
    "epicId": "epic-123",
    "displayName": "Player123",
    "stats": { ... }
  }
}
```

### POST `/api/user/get-epic-account`
Get user's linked Epic account (POST method).

**Request Body:**
```json
{
  "userId": "user-123"
}
```

---

## 🎯 Fortnite Integration

### GET `/api/fortnite/stats?username=Player123&platform=pc`
Fetch Fortnite player statistics.

**Query Parameters:**
- `username` (string): Epic username
- `epicId` (string): Epic account ID
- `platform` (string): Gaming platform (default: pc)

### POST `/api/fortnite/stats`
Fetch Fortnite player statistics (POST method).

**Request Body:**
```json
{
  "epicUsername": "Player123",
  "platform": "pc"
}
```

**Response:**
```json
{
  "success": true,
  "account": { ... },
  "stats": { ... },
  "recentMatches": [ ... ],
  "preferences": { ... },
  "osirionData": { ... }
}
```

### GET `/api/fortnite/shop`
Fetch Fortnite item shop data.

**Query Parameters:**
- `section` (string): Shop section (featured, daily, weekly, all)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "string",
      "rarity": "string",
      "images": { ... },
      "price": "number",
      "currency": "string",
      "section": "string"
    }
  ]
}
```

### GET `/api/fortnite/news`
Fetch Fortnite news and announcements.

**Query Parameters:**
- `type` (string): News type (br, stw, creative, all)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "title": "string",
      "body": "string",
      "image": "string",
      "date": "string",
      "type": "string",
      "url": "string"
    }
  ]
}
```

### GET `/api/fortnite/cosmetics`
Fetch Fortnite cosmetics and items.

**Query Parameters:**
- `type` (string): Item type (all, outfit, harvesting tool, glider, etc.)
- `rarity` (string): Item rarity (all, legendary, epic, rare, etc.)
- `search` (string): Search term for item names/descriptions

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "type": "string",
      "rarity": "string",
      "images": { ... },
      "releaseDate": "string",
      "lastUpdate": "string",
      "obtained": "boolean",
      "season": "string",
      "battlePass": "boolean"
    }
  ]
}
```

### GET `/api/fortnite/map`
Fetch Fortnite map and POI data.

**Query Parameters:**
- `season` (string): Season to fetch map for (current, specific season)

**Response:**
```json
{
  "success": true,
  "data": {
    "pois": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "type": "string",
        "image": "string",
        "coordinates": { "x": "number", "y": "number" },
        "rarity": "string",
        "lootQuality": "string",
        "playerTraffic": "string",
        "rotation": "string",
        "season": "string",
        "specialFeatures": [ ... ],
        "strategies": { ... }
      }
    ],
    "currentSeason": "string",
    "mapVersion": "string",
    "lastUpdate": "string"
  }
}
```

---

## 💳 Subscription Management
### POST `/api/check-subscription`
Check user subscription status.

**Request Body:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "hasActiveSubscription": true,
  "subscriptionTier": "pro",
  "tier": { ... },
  "usage": { ... },
  "limits": { ... }
}
```

### POST `/api/create-checkout-session`
Create Stripe checkout session.

**Request Body:**
```json
{
  "priceId": "price_123",
  "userId": "user-456",
  "tier": "pro"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

---

## 🔔 Webhooks
### POST `/api/webhooks/stripe`
Handle Stripe webhook events.

**Headers:**
- `stripe-signature`: Webhook signature

**Supported Events:**
- `checkout.session.completed`
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

---

## 📊 Osirion Analytics
### POST `/api/osirion/compute`
Request compute from Osirion API.

**Request Body:**
```json
{
  "userId": "user-123",
  "computeType": "match_analysis",
  "data": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "computeRequest": { ... },
  "usage": { ... }
}
```

### POST `/api/osirion/replay`
Upload replay to Osirion.

**Request Body:**
```json
{
  "userId": "user-123",
  "replayFile": "base64_encoded_file",
  "metadata": { ... }
}
```

### POST `/api/osirion/stats`
Get Osirion statistics.

**Request Body:**
```json
{
  "userId": "user-123",
  "epicId": "epic-456"
}
```

---

## 🔧 Environment Variables
Make sure these environment variables are configured:

```bash
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Epic Games
EPIC_CLIENT_ID=
EPIC_CLIENT_SECRET=
EPIC_REDIRECT_URI=

# Osirion
OSIRION_API_KEY=

# Fortnite API
FORTNITE_API_KEY=

# Base URL
NEXT_PUBLIC_BASE_URL=
```

---

## 📝 Error Handling
All APIs return consistent error responses:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

**HTTP Status Codes:**
- `200`: Success
- `400`: Bad Request (missing parameters)
- `500`: Internal Server Error

---

## 🚀 Getting Started
1. Set up environment variables
2. Start the development server: `npm run dev`
3. Test the health endpoint: `GET /api/health`
4. Use the APIs in your frontend application

---

## 🔍 Testing
Test all APIs using the health check endpoint:
```
GET /api/health
```

This will show the status of all APIs and their dependencies.
