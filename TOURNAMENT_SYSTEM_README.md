# 🏆 Tournament System - PathGen AI

## Overview

The Tournament System is a comprehensive tool integrated into PathGen AI that helps Fortnite players track tournaments, calculate targets, and master competitive strategies. It includes real-time tournament data, interactive calculators, and AI-powered coaching.

## Features

### 🎯 Tournament Calculator
- **Real-time tracking** of game results and points
- **Target calculation** based on tournament format
- **Progress monitoring** with remaining games and points needed
- **Multiple tournament support** (FNCS, Icon Reload, Division Cups)

### 📊 Tournament Data
- **Icon Reload Cups** (Lachlan, Loserfruit, Bugha, Clix)
- **FNCS Division Cups** - Week 2 Day 1
- **Champion Crystal Cup** - Final Results
- **Points systems** and qualification targets
- **Rules, tips, and strategy examples**

### 🤖 AI Integration
- **Tournament-specific coaching** based on current events
- **Strategy recommendations** for different tournament types
- **Performance analysis** in competitive context
- **Real-time updates** and advice

## Tournament Types

### 1. Icon Reload Cups
- **Format:** Duos Reload (Slurp Rush map)
- **Duration:** 2.5 hours (NOT 3 hours)
- **Games:** 10
- **Key Rules:**
  - No Region Lock
  - Can die off spawn 1-2 times without affecting placement
  - OCE/ASIA may not use points based matchmaking
- **Strategy:** Balance eliminations with placements

### 2. FNCS Division Cups
- **Format:** Division Cups
- **Duration:** 3 hours
- **Games:** 10
- **Key Rules:**
  - NO ELO - Next 33 teams to queue get into next game
  - Re-queue after safe time to avoid bugs
  - Play for experience even if not qualifying

#### Division Targets
- **Division 1:** Top 33 - 340 points
- **Division 2:** Top 40 - 355 points, Top 100 - 315 points
- **Division 3:** Top 300 - 285 points, Top 1000 - 255 points

### 3. Champion Crystal Cup
- **Format:** Champion Cup
- **Duration:** 3 hours
- **Games:** 10
- **Final Results:**
  - Top 100: 323 points
  - Top 1800: 269 points

## Points System

### Standard Format
- **Eliminations:** 1 point each
- **Placements:** 20th = 1 point, 19th = 2 points, ..., 1st = 20 points

### Example Strategies
- **Division 1 (340 points):** 1 Win with 12 Elims, 3 Top 5s with 6 Elims, 3 Top 10s with 3 Elims, 3 spare games
- **Division 2 (355 points):** 2 Wins with 8 Elims, 4 Top 5s with 5 Elims, 1 Top 10 with 3 Elims, 3 spare games
- **Champion Cup (275 points):** 2 Top 5s with 3 Elims, 2 Top 10s with 2 Elims, 3 Top 25s with 0 Elims, 3 spare games

## How to Use

### 1. Access Tournament Hub
- Navigate to `/tournaments` in the app
- Or use the "Tournaments" link in the navbar

### 2. Tournament Overview
- View all active, upcoming, and completed tournaments
- Click on tournaments for detailed information
- See rules, tips, and strategy examples

### 3. Tournament Calculator
- Select your tournament type
- Set your target points
- Add game results (placement + eliminations)
- Track progress and calculate remaining targets

### 4. AI Coaching
- Ask the AI about specific tournaments
- Get personalized strategy advice
- Receive real-time tournament updates
- Access comprehensive performance analysis

## AI Commands

### Tournament Questions
- "Tell me about tournaments"
- "What are the Icon Reload Cup rules?"
- "How do I qualify for Division 1?"
- "What's the strategy for Champion Cup?"

### Strategy Questions
- "How many points do I need for top 100?"
- "What's the best approach for Division 2?"
- "How should I play Icon Reload Cups?"

## Technical Implementation

### Components
- `TournamentCalculator.tsx` - Interactive calculator component
- `tournament-data.ts` - Comprehensive tournament database
- `TournamentsPage.tsx` - Dedicated tournaments page
- AI integration in `ai/page.tsx`

### Data Structure
```typescript
interface TournamentInfo {
  id: string;
  name: string;
  type: 'icon-reload' | 'fncs-division' | 'fncs-champion';
  region: string;
  format: string;
  duration: string;
  games: number;
  pointsSystem: {
    eliminations: number;
    placements: Array<{ position: number; points: number }>;
  };
  targets: Array<{ rank: string; points: number; description: string }>;
  rules: string[];
  tips: string[];
  examples: Array<{ description: string; breakdown: string }>;
  status: 'upcoming' | 'active' | 'completed';
  dates?: string[];
  results?: Array<{ rank: string; points: number; note?: string }>;
}
```

## Future Enhancements

- **Real-time leaderboards** integration
- **Tournament scheduling** and reminders
- **Advanced analytics** and performance tracking
- **Team formation** tools for duos/squads
- **VOD analysis** integration
- **Custom tournament** creation

## Support

For questions about the tournament system:
1. Use the AI Coach in the `/ai` page
2. Check the tournament calculator for specific calculations
3. Review tournament details in the `/tournaments` page
4. Ask about specific tournaments by name or type

---

**Note:** Tournament data is updated regularly based on official Fortnite competitive events. Always verify current information before making strategic decisions.
