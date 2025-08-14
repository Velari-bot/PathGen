// AI Documentation Manager
// This file contains all the core documentation that gets automatically included
// in the AI's knowledge base for every user interaction.

export interface AIDocumentation {
  zoneGuides: string;
  mechanics: string;
  strategies: string;
  metaAnalysis: string;
  tipsAndTricks: string;
}

// Zone Guides - Map knowledge and strategies
export const zoneGuides = `
# Fortnite Zone Management Guide

## Chapter 6 Season 4 POI Data & Landing Strategy

### 🗺️ POI Statistics & Ratings

#### **EU Server - Top Landing Spots**

**High-Tier Landing Spots (Overall Rating 100+)**
- **Martial Maneuvers** - Zone 3, 9300 loot, 1600 metal, 1.24 avg teams, 62% survival rate, **109 rating**
- **Rocky Rus** - Zone 6, 9300 loot, 1600 metal, 1.24 avg teams, 62% survival rate, **109 rating**
- **Swarmy Stash** - Zone 7, 9300 loot, 1600 metal, 1.24 avg teams, 62% survival rate, **109 rating**
- **Pumpkin Pipes** - Zone 9, 9300 loot, 1600 metal, 1.24 avg teams, 62% survival rate, **109 rating**
- **Open-Air Onsen** - Zone 10, 9300 loot, 1600 metal, 1.24 avg teams, 62% survival rate, **109 rating**

**Mid-Tier Landing Spots (Overall Rating 70)**
- **Yacht Stop** - Zone 2, 72 loot, 2600 metal, 1.31 avg teams, 50% survival rate, **70 rating**
- **Supernova Academy** - Zone 5, 72 loot, 2600 metal, 1.31 avg teams, 50% survival rate, **70 rating**
- **O.Z.P. HQ Base Tunnel** - Zone 8, 72 loot, 2600 metal, 1.31 avg teams, 50% survival rate, **70 rating**
- **Overlook Lighthouse** - Zone 11, 72 loot, 2600 metal, 1.31 avg teams, 50% survival rate, **70 rating**
- **Shining Span** - Zone 12, 72 loot, 2600 metal, 1.31 avg teams, 50% survival rate, **70 rating**

**Low-Tier Landing Spots (Overall Rating 41)**
- **Fighting Frogs** - Zone 1, 38 loot, 1600 metal, 0.48 avg teams, 24% survival rate, **41 rating**
- **First Order Base** - Zone 4, 38 loot, 1600 metal, 0.48 avg teams, 24% survival rate, **41 rating**
- **Salty Docks** - Zone 13, 38 loot, 1600 metal, 0.48 avg teams, 24% survival rate, **41 rating**
- **Kappa Kappa Factory** - Zone 14, 38 loot, 1600 metal, 0.48 avg teams, 24% survival rate, **41 rating**
- **Utopia City** - Zone 15, 38 loot, 1600 metal, 0.48 avg teams, 24% survival rate, **41 rating**

#### **NA Server - Top Landing Spots**

**High-Value Landing Spots**
- **Crabby Cove** - Zone 121, 101 loot, 9300 metal, 0.96 avg teams, 58% survival rate
- **Rogue Slurp Room Market** - Zone 59, 49 loot, 9600 metal, 1.11 avg teams, 63% survival rate
- **Kappa Kappa Factory** - Zone 55, 57 loot, 3500 metal, 1.53 avg teams, 63% survival rate
- **Rolling Blossoms Farm** - Zone 62, 75 loot, 3400 metal, 1.26 avg teams, 60% survival rate
- **Outpost Enclave** - Zone 74, 75 loot, 2600 metal, 1.28 avg teams, 62% survival rate

**Strategic Landing Considerations**
- **Low Competition:** Fighting Frogs (0.48 avg teams), First Order Base (0.48 avg teams)
- **High Metal:** First Order Base (10,000 metal), Rogue Slurp Room Market (9600 metal)
- **High Survival:** Kappa Kappa Factory (63%), Rogue Slurp Room Market (63%)
- **Balanced Loot:** Most POIs offer 48-75 loot with 200-10,000 metal

### 🎯 Landing Strategy Based on POI Data

#### **Aggressive Players (High Competition)**
- Target **Martial Maneuvers, Rocky Rus, Swarmy Stash** for high loot potential
- Expect 1.24 avg teams but high survival rate (62%)
- High metal availability (1600) for building-intensive playstyles

#### **Passive Players (Low Competition)**
- Land at **Fighting Frogs, First Order Base** for minimal early fights
- Lower loot (38) but very low competition (0.48 avg teams)
- Good for survival-focused gameplay

#### **Resource-Focused Players**
- **First Order Base** offers 10,000 metal (highest in dataset)
- **Rogue Slurp Room Market** provides 9600 metal
- **Crabby Cove** offers 9300 metal with low competition

#### **Zone-Aware Landing**
- **Zone 1-3:** Focus on guaranteed coverage areas using zone prediction mechanics
- **Zone 4-6:** Consider Rift Island mechanics when choosing landing spots
- **Late Zones:** Prioritize survival rate over loot quantity

## Advanced Zone Prediction & Mechanics

### 🔁 The Double Pull Phenomenon
When Zone 1 appears near the edge or corner of the map, Zone 2 has an 85% chance to continue in the same direction. This creates the "Double Pull" effect where players feel forced to keep running.

**Zone 2 Prediction Stats (when Zone 1 is near edge):**
- Far zone (continues direction): 63%
- Slightly toward edge: 22%
- Pulls back a little: 10%
- Pulls back a lot: 5%

### 🧠 Guaranteed Zone Strategy
**Zone Dimensions & Guaranteed Coverage:**
- Zone 1: 2400m wide
- Zone 2: 1900m wide
- Zone 2 must be fully inside Zone 1

**Strategic Positioning:**
- Position in the center of Zone 1 (dark green area) = guaranteed to be in Zone 2
- This central position is also guaranteed to be in Zone 3
- Result: No movement needed until Zone 4

### 🏝 Rift Island & Zone 6 Mechanics
**Rift Island Behavior:**
- Spawns during Zone 4, always inside Zone 4
- Often in Zone 5, but not guaranteed
- Actively avoids Zone 6

**Zone 6 Avoidance Stats:**
- Normal chance of Rift Island being in Zone 6: 25%
- Due to avoidance logic: 6%
- Chapter 4: Nearly 0% (1 in 10,000 games)
- Note: No effect on Zones 7-12

**Strategic Insight:** If Rift Island is near Zone 5 edge, Zone 6 is 4x less likely in that direction.

### 🌊 Ocean Zone Restrictions
- Zone centers cannot be over the ocean
- Epic draws coastline boundaries to prevent water zone centers
- If Zone 5 is near map edge, Zone 6 will not pull toward ocean

### 🚫 Blacklisted Areas
- Chapters 3, 4, and 5 had certain "blacklisted" areas
- Zones couldn't spawn in these locations
- Currently: No blacklisted areas (subject to change in updates)

### 🦙 Llamas & Zone Prediction (Chapter 2 Remix)
**Llama Mechanics:**
- Always spawn in the next unseen zone
- Spotting a Llama reveals the next zone location
- Works at all game stages
- Currently not in tournaments

**Example:** Llama in Zone 1 = Zone 2 location revealed

### ❌ Debunked Zone Myths
**False Beliefs:**
- Zones intentionally go over mountains
- Zones intentionally go over water
- Zones favor new POIs
- Moving zones follow "pull back, pull forward, pull back" pattern
- Zones were rigged for specific players

### 📊 Zone Prediction Strategy Summary
1. **Land Assessment:** Check Zone 1 position relative to map edges
2. **Double Pull:** If Zone 1 is near edge, expect Zone 2 to continue that direction
3. **Center Positioning:** Use guaranteed coverage areas for strategic advantage
4. **Rift Island:** Monitor for Zone 6 avoidance patterns
5. **Ocean Awareness:** Zones won't center over water
6. **Llama Intel:** Use for next zone prediction when available

## Basic Zone Management

### Zone Types
- **Safe Zone:** The playable area that shrinks over time
- **Storm:** Damaging area outside the safe zone
- **Moving Zone:** Final zones that move to force player engagement

### Zone Timing
- **Zone 1:** 3 minutes
- **Zone 2:** 2 minutes 30 seconds
- **Zone 3:** 2 minutes
- **Zone 4:** 1 minute 45 seconds
- **Zone 5:** 1 minute 30 seconds
- **Final Zones:** 1 minute each

### Rotation Strategies
- **Early Game:** Focus on looting and positioning
- **Mid Game:** Use guaranteed zone areas for strategic advantage
- **Late Game:** Adapt to moving zones and final circle predictions

### Building for Zones
- **Zone 1-3:** Build bases in guaranteed coverage areas
- **Zone 4-6:** Prepare for potential Rift Island mechanics
- **Final Zones:** Build for mobility and quick rotations
`;

// Core Game Mechanics
export const mechanics = `
# Fortnite Core Mechanics

## Building
- Wall + Ramp + Floor = Basic box for protection
- Stair + Wall = Quick high ground advantage
- Cone + Wall = Defensive structure
- Edit windows and doors for visibility and movement

## Combat
- First Shot Accuracy: Wait for crosshair to settle
- Peek shooting: Edit a window, shoot, close quickly
- Build fighting: Use builds to gain positioning advantage
- Shotgun + SMG combo: Shotgun for damage, SMG for finish

## Movement
- Crouch while looting to reduce hitbox
- Jump while building to place structures faster
- Use ramps for quick elevation changes
- Sprint only when necessary to conserve stamina

## Inventory Management
- Keep 2-3 weapons, 2 healing items, 1 utility item
- Prioritize shield over health items
- Carry materials (wood for quick builds, brick/metal for late game)
- Use quick weapon switching (1-5 keys)
`;

// Advanced Strategies
export const strategies = `
# Advanced Fortnite Strategies

## Tournament Strategy & Trio Surge Mechanics

### 🎯 **Trio Surge - Chapter 6 Season 1**
**Player Count by Zone:**
- **Zones 2-3:** 90 players
- **Zone 4:** 78 players
- **Zone 5:** 63 players
- **Zone 6:** 54 players
- **Zone 7:** 42 players
- **Zone 8:** 39 players
- **Zones 9-12:** 30 players

### 🏆 **Current Tournament Schedule & Formats**

#### **FNCS Divisional Practice Cups (Trios)**
- **Duration:** 3 weeks until Globals
- **Format:** Same as previous divisional cups
- **Purpose:** Practice and preparation for major tournaments

#### **Duos Divisional Cups**
- **Timing:** After Globals, during September+October
- **Divisions:** 5 for EU/NAC, 3 for other regions
- **Seeding:**
  - **Div 1:** Seeded from current Div 1 players (likely need Grands qualification or recent Div Cup success)
  - **Other Divs:** Seeded from TRIAL tournament
- **Promotion:** Every session (twice per week) instead of cumulative weekly
- **Note:** This doesn't mean permanent shift to Duos - likely temporary until Chapter 7

#### **Solo Series**
- **Frequency:** 1 tournament per week
- **Timing:** Uncertain if starts immediately or after Globals
- **Format:** Single round tournament with no divisions
- **Scoring:** Best 4 scores out of 6 weeks count toward final ranking
- **Qualification:** Top 100 players qualify for Final with cash prizes
- **Purpose:** Replacement for Solo Cash Cups with anti-cheat measures
- **Strategy:** Important for proving yourself with good placements even without Final qualification

#### **Reload Quick Cups**
- **Round 1:** 3 matches, best score counts
- **Qualification:** Win with 5+ elims = top group Round 2
- **Alternative:** Can still play lower group Round 2
- **Round 2:** Sum of points from 3 games
- **Before Globals:** Branded as skin cups, cosmetics for top teams
- **After Globals:** Set-lobby final for Top 20 teams with cash prizes
- **Advantage:** Great mode, gives everyone chance to reach top group, only 1-2 hours

#### **Other Tournaments**
- **Skin Cups:** Multiple before Globals (Blade/Axe of Champions, Surf Witch, Lachlan, Bugha, Clix)
- **Formats:** Mix of Reload Quick Cup format and normal BR
- **Ranked Cups:** Continue as usual
- **PS Cup:** 3rd/4th September

### 📅 **Specific Tournament Schedule - First 2 Weeks**

#### **Week 1 (August 8-17)**
- **Fri 8th:** Perf Eval Cup
- **Sat 9th:** Nothing
- **Sun 10th:** Nothing
- **Mon 11th:** Nothing
- **Tue 12th:** Perf Eval Cup
- **Wed 13th:** FNCS Trio Divisional Practice Cups
- **Thu 14th:** FNCS Trio Divisional Practice Cups
- **Fri 15th:** Aces Wild FNCS Cup (New Reload format)
- **Sat 16th:** Champion PJ FNCS Cup (Battle Royale), Div 1 Final
- **Sun 17th:** Duos Console Victory CC, Champion Crystal FNCS Cup, OG Cup

#### **Week 2 (August 18-24)**
- **Mon 18th:** Nothing
- **Tue 19th:** Perf Eval Cup
- **Wed 20th:** FNCS Trio Divisional Practice Cups, Lachlan Icon Cup
- **Thu 21st:** FNCS Trio Divisional Practice Cups, Loserfruit Icon Cup
- **Fri 22nd:** Bugha Icon Cup
- **Sat 23rd:** Clix Icon Cup, Div 1 Final
- **Sun 24th:** Duos Console Victory CC, Blade of Champions Cup, OG Cup

**Note:** Very packed schedule with overlapping cups - players can choose what to play based on format preference and time availability.

### 🎴 **Boon Mechanics & Competitive Impact**

#### **Standard Boons**
**Agile Aiming Boon:**
- **Effect:** While aiming down sights, recoil and spread reduced, maintain more movement speed
- **Competitive Value:** Clear advantage for competitive players
- **Strategic Use:** Better accuracy during fights while maintaining mobility

**Extended Magazine Boon:**
- **Effect:** Increases clip size for all weapons
- **Competitive Value:** Definitely useful in competitive play
- **Strategic Applications:** 
  - Shotgun boxfights (more shots before reload)
  - AR spray (longer sustained fire)

**Storm Forecast Boon:**
- **Effect:** Next Storm circle always revealed to you
- **Current Status:** Available in competitive at the moment
- **Expected Change:** Likely to be removed from competitive
- **Strategic Impact:** Major advantage if available, plan accordingly

#### **Super Soldier Ranked Boons (O.X.R. Drop Pods Only)**
**Rank B:**
- **Effect:** Reduces Energy consumption when sprinting
- **Strategic Value:** Better mobility and rotation capability

**Rank A:**
- **Effect:** Rank B ability + increases reload speed
- **Strategic Value:** Faster reloads in combat situations

**Rank S:**
- **Effect:** Rank B and A abilities + reduces weapon recoil and spread
- **Strategic Value:** Better accuracy and control

**Rank S+:**
- **Effect:** Rank B, A, and S abilities + increases sprint speed and unlimited Energy
- **Competitive Impact:** Crazy powerful - infinite sprint for rest of game
- **Strategic Advantage:** Massive advantage in midgame and endgame
- **Priority:** Highest priority when available

### 🪙 **Mythics & Medallions - Chapter 6 Season 4**

#### **The Hive**
**Mythic Enhanced Wrecker Revolver:**
- **Description:** Possible shotgun replacement - pros might actually use this
- **Strategic Value:** High - could revolutionize close-range combat meta
- **Usage:** Close-range engagements, potential shotgun alternative

**Surge Medallion:**
- **Effect:** Increases movement speed and gives burst of speed when sliding
- **Strategic Value:** High mobility advantage
- **Usage:** Quick rotations, escape maneuvers, aggressive pushes

#### **Demon's Domain**
**Mythic O.X.R. Assault Rifle:**
- **Description:** Similar to the spire rifle
- **Strategic Value:** High - mythic AR with enhanced capabilities
- **Usage:** Mid-range engagements, building destruction

**Springleg Medallion:**
- **Effect:** Double jump with fall damage immunity
- **Strategic Value:** High - unique mobility advantage
- **Usage:** High ground retakes, escape maneuvers, aggressive positioning

#### **Ranger's Ruin**
**Mythic Sweeper Shotgun:**
- **Description:** This season's "Tac shotgun"
- **Strategic Value:** High - mythic version of reliable weapon
- **Usage:** Close-range combat, box fighting

**Carapace Medallion:**
- **Effect:** 50 white siphon, passively gives 3 shield per second up to 50 shield max
- **Strategic Value:** Very High - continuous shield regeneration
- **Usage:** Sustained combat, endgame survival, aggressive playstyles

#### **O.X.R. Drop Pod Mythic (Rank S+)**
**Available Mythics:**
- **Enhanced Assault Rifle (Scar):** Upgraded version of reliable AR
- **Overclocked Pulse Rifle:** High-damage energy weapon
- **Enhanced Havoc Shotgun:** Upgraded pump shotgun

### 🏃‍♂️ **Mobility System - Chapter 6 Season 4**

#### **Mobility Items**
**Fizz:**
- **Effect:** Mobility consumable
- **Strategic Value:** Very High - every team will be taking this
- **Usage:** Combined with other mobility items for maximum distance

**Crash Pad Jr:**
- **Effect:** Smaller version of crash pads
- **Strategic Value:** High - more portable than regular crash pads
- **Usage:** Quick escapes, repositioning

**New Launch Pads:**
- **Effect:** Goes higher than previous versions
- **Strategic Value:** High - better vertical mobility
- **Usage:** High ground retakes, escape maneuvers

**Fizz + Crash/Launch Combination:**
- **Effect:** Can go really far distance (130m)
- **Strategic Value:** Very High - covers zones 5-8
- **Usage:** Mid-game rotations, avoiding storm damage
- **Advantage:** No slow gliding problems like launch pads

#### **Environmental Mobility**
**Geysers:**
- **Effect:** Give you 30 HP as well as mobility
- **Strategic Value:** Medium - health boost + movement
- **Usage:** Early game rotations, health recovery

**New Launch Pads:**
- **Effect:** Enhanced vertical mobility
- **Strategic Value:** High - better than previous versions
- **Usage:** High ground advantage, escape routes

#### **Medallion Mobility**
**Surge Medallion (The Hive):**
- **Effect:** Increased movement speed + burst when sliding
- **Strategic Value:** High - consistent speed advantage

**Springleg Medallion (Demon's Domain):**
- **Effect:** Double jump with fall damage immunity
- **Strategic Value:** High - unique mobility advantage

**Rank B and S+ Boons:**
- **Effect:** Better movement capabilities
- **Strategic Value:** High - enhanced mobility from boons

### 📦 **O.X.R. Drop Pod System**

#### **Weapon Drops**
**Rank B:** Blue weapon
**Rank A:** Purple weapon  
**Rank S:** Gold weapon
**Rank S+:** Mythic weapon

**Available Weapons:** Can be any in loot pool (Shotguns, ARs, SMG, Pistol, DMR)

**Rank S+ Mythic Options:**
- Enhanced Assault Rifle (Scar)
- Overclocked Pulse Rifle
- Enhanced Havoc Shotgun

#### **Consumable Drops**
**Rank B:** 3 Crash Pads
**Rank A:** Nothing in Comp, Shockwaves in non-comp
**Rank S:** Flare Gun in Comp, Flare Gun or Shockwave Launcher in non-comp
**Rank S+:** Nothing (weapon only)

#### **Ammo Drops**
**Types:** Light, Medium, or Shotgun
**Rank B, A, S:** 2 stacks
**Rank S+:** 4 stacks

#### **Boon Drops**
**Rank B:** Reduces Energy consumption when sprinting
**Rank A:** Rank B ability + increases reload speed
**Rank S:** Rank B and A abilities + reduces weapon recoil and spread
**Rank S+:** Rank B, A, and S abilities + increases sprint speed and unlimited Energy

### 💼 **O.X.R. Chest Contents**

#### **Guaranteed Loot**
**2 Consumables:**
- 3 x Minis (small shield potions)
- Big Pot (large shield potion)
- Med Mist (medium shield potion)
- Epic Slurp Juice (legendary healing)

**1 Utility Item:**
- Launch Pad (mobility)
- Flare Gun (utility)

**1 Weapon:**
- Minigun
- Wrecker Revolver
- Sweeper Shotgun
- O.X.R. Rifle
- **Rarity:** Will be at least blue rarity

**Ammo:**
- 1 stack of everything (Light, Medium, Shotgun)

#### **Bonus Loot**
**Boon Chance:** 12% chance of Extended Magazine Boon
- **Effect:** Increases clip size for all weapons
- **Competitive Value:** Definitely useful in competitive play
- **Strategic Applications:** Shotgun boxfights, AR spray situations

#### **Strategic Value**
**High-Priority Target:** O.X.R. chests provide guaranteed high-tier loot
**Weapon Guarantee:** Always get at least a blue weapon
**Healing Package:** Reliable shield and health items
**Mobility Option:** Launch Pad for rotations
**Boon Potential:** Extended Magazine Boon is valuable for competitive play

### 🎯 **Strategic Implications**

#### **Mobility Meta Shift**
- **Fizz + Crash Pads:** New standard for mid-game rotations
- **Launch Pads:** Still useful for early game and high ground
- **Every Team:** Will prioritize Fizz for mobility advantage
- **Distance Coverage:** 130m covers most mid-game zone distances

#### **Mythic Weapon Strategy**
- **Enhanced Wrecker Revolver:** Potential shotgun replacement
- **O.X.R. Assault Rifle:** High-priority mythic for mid-range
- **Sweeper Shotgun:** Reliable close-range option
- **Drop Pod Mythics:** Highest priority for Rank S+ players

#### **Medallion Priority**
- **Carapace:** Highest priority for shield regeneration
- **Springleg:** Unique mobility advantage
- **Surge:** Consistent speed boost
- **Strategic Choice:** Based on playstyle and team composition

#### **O.X.R. Drop Pod Strategy**
- **Rank S+ Priority:** Mythic weapon + unlimited energy
- **Rank S:** Gold weapon + accuracy boost
- **Rank A:** Purple weapon + reload speed
- **Rank B:** Blue weapon + mobility boost

### 🔫 **Competitive Loot Pool & Loadout Strategy**

#### **Primary Weapons**
**Shotgun:**
- **Sentinel Pump:** Best shotgun option for competitive
- **Wrecker Revolver:** Potential shotgun replacement - test this yourself
- **Mythic Sweeper:** Good because it's mythic, not necessarily better than pump
- **Meta Note:** Players might take Wrecker Revolver and no shotgun - wait to see which is better

**Assault Rifle:**
- **Stacked Lobbies:** O.X.R. Rifle or DMR for surge mechanics
- **General Play:** Hammer or Fury AR for increased boxfighting ability
- **Strategic Choice:** Based on whether you need surge or better boxfighting

#### **Mobility Items**
**Primary:** Crash Pads (no slow gliding problems)
**Backup:** Launch Pads if you don't get crash pads
**Essential:** Fizz for team mobility combinations

#### **Healing Items**
**Priority Order:**
1. **Legendary Slurps:** Best heals - take 2 if available
2. **Splashes:** Reliable healing
3. **Fizz:** Essential for team mobility (always want one in your team)

**Alternative Strategy:** Instead of 2nd heal, try Bug Blaster in team modes
- **Trios:** Triple-blast a team's builds
- **Team Coordination:** Get someone to spray the blast

#### **Items NOT in Competitive**
- **Swarmstrike** (the RPG thing)
- **Shockwave Launcher**
- **Shockwave Grenade**
- **Flare Gun**
- **Forecast Boon**

#### **Likely to be Removed from Competitive**
- **Bug Blaster**

### ⬆️ **O.X.R. Ranking System**

#### **Points Requirements by Mode**
| Rank | Solo | Duo  | Trio | Squad |
|------|------|------|------|-------|
| C    |   0  |   0  |   0  |    0  |
| B    |  350 |  500 |  600 |  700  |
| A    | 1000 | 1400 | 1700 | 2000  |
| S    | 2850 | 4000 | 4850 | 5700  |
| S+   | 5000 | 7000 | 8500 |10000  |

#### **Points from Bugs & Spawners**
- **Eliminate 5 swarmers:** +20 pts
- **Eliminate a bomber:** +50 pts
- **Destroy large bug spawner:** +75 pts
- **Destroy small bug spawner:** +30 pts
- **Search/destroy hive stash:** +60 pts
- **Deal 500 damage to Queen:** +10 pts
- **Eliminate Queen:** +650 pts

#### **Points from Loot & Objectives**
- **Open supply drop:** +100 pts
- **Open 10 chests:** +100 pts
- **Complete POI attack:** +400 pts
- **Open bunker:** +400 pts
- **Open rift pod:** +500 pts
- **Destroy golden POI drone:** +15 pts
- **Shadow board briefing:** +200 pts

#### **Points from Team Actions**
- **Reboot a player:** +100 pts
- **Revive a player:** +100 pts

#### **Points from Storm Survival**
- **Zone 3:** +100 pts
- **Zone 4:** +125 pts
- **Zone 5:** +150 pts
- **Zone 6:** +175 pts

#### **Points from Knocks/Elims by Rank**
| Rank | Knock | Elim | Solo Elim |
|------|-------|------|-----------|
| S+   |  200  | 200  |    400    |
| S    |  150  | 150  |    300    |
| A    |  125  | 125  |    250    |
| B    |  100  | 100  |    200    |
| C    |   75  |  75  |    150    |

### 🎯 **Competitive Loadout Strategy**

#### **Optimal Loadout (5 Slots)**
1. **Primary Weapon:** Sentinel Pump or Wrecker Revolver
2. **Secondary Weapon:** Hammer/Fury AR (general) or O.X.R./DMR (stacked)
3. **Mobility:** Crash Pads + Fizz
4. **Healing:** Legendary Slurp
5. **Utility:** Bug Blaster (team modes) or 2nd heal

#### **Loadout Variations**
**Aggressive Players:**
- Wrecker Revolver + O.X.R. Rifle + Crash Pads + Fizz + Slurp

**Passive Players:**
- Sentinel Pump + Hammer AR + Launch Pads + Fizz + 2 Slurps

**Team Players:**
- Pump + AR + Crash Pads + Fizz + Slurp + Bug Blaster

#### **Ranking Strategy**
**Early Game (Ranks C-B):**
- Focus on survival and basic eliminations
- Target lower-ranked players for easier points
- Complete basic objectives (chests, supply drops)

**Mid Game (Ranks B-A):**
- Balance eliminations with survival
- Target bug spawners and hive stashes
- Coordinate with team for POI attacks

**Late Game (Ranks A-S+):**
- Focus on high-value eliminations
- Target Queen elimination (650 pts)
- Maximize storm survival points
- Coordinate team actions for maximum efficiency

### ⏰ **Final Queue Timing Strategy**

#### **Queue Timing Windows**
**xx:40-xx:45 Games:**
- **Risk:** High chance of being "keyed" off spawn (hard w-keying)
- **Reward:** Endgame will be more dead, easier placement
- **Strategy:** Land safe, hide from keyers, survive to endgame

**xx:45-xx:52 Games:**
- **Risk:** Heavy keying in first 5 minutes
- **Reward:** Passive mid-game, steady player count decline
- **Strategy:** Survive initial chaos, then play for placement

**Final 10 Minutes:**
- **Risk:** More stacked lobbies throughout
- **Reward:** Less keying off spawn
- **Strategy:** Better for players close to qualifying

#### **When to Queue for Last Game**
**Safe Landing Strategy (xx:40-xx:50):**
- Higher chance of being keyed off spawn
- Endgame will be more dead
- **Best for:** Players who can land safe and avoid keyers

**Stacked Game Strategy (Final 10 minutes):**
- Less keying off spawn
- More stacked throughout
- **Best for:** Players close to qualifying who need consistent performance

### 🎮 **Tournament Decision Making**

#### **Staying in Game vs. Final Queue**
**Key Questions to Ask:**
1. **Points Potential:** How many points can I gain in 2 more minutes?
   - Moving zones = high potential
   - 1st zone = low potential
2. **Points Needed:** How many points do I need to qualify?
   - Few points needed = worth staying
   - Many points needed = leave and key final game

#### **Key Game vs. Stacked Game Decision**
**Key Game Advantages:**
- Avoid really busy map areas
- Get "free" placement points
- Less stacked endgames
- No surge concerns

**Stacked Game Reality:**
- You won't drop down enough in 10-15 minutes for significant difference
- **Recommendation:** Load into key game, avoid busy areas

#### **W-Key Game Decision Factors**
**Stay in Game If:**
- Good loot available
- Haven't earned placement points yet
- Need few points to qualify
- Can survive with current loot

**Leave Game If:**
- Poor loot situation
- Need many points (40+) to qualify
- High risk of early death

### 🤼 **Points-Based Matchmaking (PBMM)**

#### **How PBMM Works**
**Two-Sided Magnet Effect:**
- **Doing Badly:** Get easier lobbies, move up leaderboard
- **Doing Well:** Get harder lobbies, likely to drop back down
- **True Ability:** PBMM pulls you toward your actual skill level

#### **Tournament Timing Strategy**
**Last Hour Importance:**
- **Most critical time** of every tournament
- **Final game** is especially crucial
- **Advantage:** Less time for PBMM to pull you back down
- **Risk:** Bad final game = no recovery chances

**Mental Strategy:**
- Don't get discouraged by poor first 1-2 hours
- Good final hour can change everything
- Never play aggressive in final game unless necessary
- Focus on survival and placement in final game

### ⏰ **Starting Late Strategy**

#### **Statistical Reality**
**No Advantage/Disadvantage:**
- Teams starting up to 30 minutes late have identical expected results
- Late start doesn't provide competitive edge

#### **Starting Late Considerations**
**Advantages:**
- Easier first lobby on average
- Better chance of big win and elims
- Mental boost from starting with victory
- Extra game available during tournament

**Disadvantages:**
- "Lose" time not playing
- First game finishes after everyone else
- RNG still exists in first game

#### **When Starting Late is Bad**
**Avoid Late Start If:**
- Placement points are extremely important
- Need maximum endgame opportunities
- System requires playing as many endgames as possible

#### **PBMM Balance**
**Why Late Start Doesn't Work:**
- Easier first game is offset by PBMM
- Harder subsequent games wipe out advantage
- Everyone else already has points
- No lasting competitive edge

## Zone Prediction & Strategic Positioning

### The Double Pull Counter-Strategy
When you land and see Zone 1 near an edge:
1. **Immediate Assessment:** Zone 2 will likely continue that direction (85% chance)
2. **Strategic Response:** Position yourself in the guaranteed center area of Zone 1
3. **Result:** You won't need to move until Zone 4, giving you massive strategic advantage

### Guaranteed Zone Positioning
**Zone 1-3 Strategy:**
- Land in Zone 1 center (2400m wide)
- Build your base in the guaranteed coverage area (1900m wide)
- This area is guaranteed to be in Zone 2 AND Zone 3
- Use this time to gather resources, heal, and prepare for later zones

**Zone 4-6 Strategy:**
- Monitor Rift Island spawn location
- If Rift Island is near Zone 5 edge, Zone 6 is 4x less likely in that direction
- Position yourself accordingly for Zone 6 prediction

### Advanced Rotation Planning
**Early Game (Zones 1-3):**
- Use guaranteed zone areas to avoid unnecessary movement
- Focus on resource gathering and base building
- Monitor player count and adjust aggression level

**Mid Game (Zones 4-6):**
- Adapt to Rift Island mechanics
- Use ocean zone restrictions to predict safe areas
- Position for final zone predictions

**Late Game (Zones 7+):**
- Rift Island has no effect on final zones
- Focus on mobility and quick rotations
- Use natural cover and high ground

## Box Fighting
- Build a 1x1 box when under pressure
- Edit walls to create shooting angles
- Use cones to block enemy edits
- Place traps strategically in corners

## High Ground Retakes
- Thwifo cone technique for quick elevation
- Side jump + ramp for lateral movement
- Double ramp + wall for protection
- Use launch pads or shockwaves when available

## Team Fighting
- Coordinate builds with teammates
- Use different materials to avoid confusion
- Communicate rotations and enemy positions
- Share resources and healing items

## End Game Tactics
- Stay in the center of safe zones
- Use natural cover when possible
- Conserve materials for final fights
- Stay mobile to avoid being pinched
- Use utility items strategically (shockwaves, launch pads)

## Zone-Aware Combat
- Fight near zone edges to force opponents into storm
- Use zone mechanics to predict enemy rotations
- Position yourself in guaranteed coverage areas during fights

## Landing Strategy Based on POI Data

### **EU Server Landing Priorities**
**High-Tier (Rating 109):** Martial Maneuvers, Rocky Rus, Swarmy Stash, Pumpkin Pipes, Open-Air Onsen
- **Best for:** Aggressive players seeking high loot (9300) and metal (1600)
- **Competition:** Moderate (1.24 avg teams) but high survival rate (62%)
- **Strategy:** Land early, loot quickly, use guaranteed zone positioning

**Mid-Tier (Rating 70):** Yacht Stop, Supernova Academy, O.Z.P. HQ Base Tunnel
- **Best for:** Balanced players wanting decent loot (72) and metal (2600)
- **Competition:** Higher (1.31 avg teams) with moderate survival (50%)
- **Strategy:** Land with team coordination, focus on metal gathering

**Low-Tier (Rating 41):** Fighting Frogs, First Order Base, Salty Docks
- **Best for:** Passive players or solo queue survival
- **Competition:** Very low (0.48 avg teams) but low survival (24%)
- **Strategy:** Land for guaranteed zone coverage, avoid early fights

### **NA Server Landing Priorities**
**High-Value Metal Locations:**
- **First Order Base:** 10,000 metal (highest in dataset)
- **Rogue Slurp Room Market:** 9600 metal with 63% survival rate
- **Crabby Cove:** 9300 metal with low competition (0.96 avg teams)

**Survival-Focused Locations:**
- **Kappa Kappa Factory:** 63% survival rate, good metal (3500)
- **Outpost Enclave:** 62% survival rate, balanced resources
- **Rolling Blossoms Farm:** 60% survival rate, high loot (75)

### **Landing Strategy by Playstyle**
**Aggressive Players:**
1. Target high-tier POIs (Martial Maneuvers, Rocky Rus)
2. Accept higher competition for better loot
3. Use guaranteed zone positioning for mid-game advantage

**Passive Players:**
1. Land at low-competition POIs (Fighting Frogs, First Order Base)
2. Focus on survival and zone positioning
3. Use guaranteed coverage areas to avoid rotations

**Resource Players:**
1. Prioritize high-metal POIs (First Order Base, Rogue Slurp Room)
2. Balance metal needs with competition level
3. Use metal advantage for building-intensive strategies

**Zone-Aware Players:**
1. Combine POI data with zone prediction mechanics
2. Use guaranteed coverage areas in Zone 1-3
3. Adapt landing strategy based on Zone 1 position
`;

// Meta Analysis
export const metaAnalysis = `
# Current Fortnite Meta Analysis

## Weapon Meta
- Shotguns: Pump and Tactical are most reliable
- SMGs: Great for breaking builds and finishing enemies
- Rifles: Use for medium-long range engagements
- Snipers: High risk, high reward for skilled players

## Item Priority
- Shield potions > Health items
- Launch pads and shockwaves for mobility
- Traps for defensive plays
- Grenades for area denial

## Build Meta
- Quick box building for protection
- High ground retakes for advantage
- Material conservation in late game
- Strategic use of natural cover

## Playstyle Adaptation
- Aggressive early game for loot advantage
- Defensive mid game to survive rotations
- Calculated aggression in late game
- Adapt to zone locations and player count
`;

// Tips and Tricks
export const tipsAndTricks = `
# Pro Tips and Tricks

## General Gameplay
- Always have an escape plan
- Use audio cues to locate enemies
- Stay aware of storm timing
- Don't overcommit to fights

## Zone Prediction Tips
- **Double Pull:** If Zone 1 is near edge, expect Zone 2 to continue that direction (85% chance)
- **Guaranteed Coverage:** Position in Zone 1 center to avoid movement until Zone 4
- **Rift Island Intel:** Monitor for Zone 6 avoidance patterns
- **Ocean Awareness:** Zones won't center over water - use this for predictions
- **Llama Spots:** In Chapter 2 Remix, Llamas reveal next zone location

## Landing Spot Tips
- **High-Tier POIs:** Martial Maneuvers, Rocky Rus, Swarmy Stash (9300 loot, 62% survival)
- **Low Competition:** Fighting Frogs, First Order Base (0.48 avg teams, good for passive play)
- **Metal Focus:** First Order Base (10,000 metal), Rogue Slurp Room Market (9600 metal)
- **Survival Focus:** Kappa Kappa Factory, Rogue Slurp Room Market (63% survival rate)
- **Zone Strategy:** Combine POI choice with guaranteed zone coverage areas

## Tournament Strategy Tips
- **Queue Timing:** xx:40-xx:50 = more keying but dead endgame, final 10 min = stacked but less keying
- **Final Game:** Never play aggressive unless absolutely necessary, focus on survival
- **PBMM Reality:** Bad first 1-2 hours don't matter, good final hour changes everything
- **Key vs Stacked:** Choose key game, avoid busy areas, get free placement points
- **Starting Late:** No advantage/disadvantage, but avoid if placement points are crucial

## Tournament Format Tips
- **Solo Series:** Focus on consistent top placements across 6 weeks, best 4 scores count
- **Reload Quick Cups:** Round 1 prioritize elims over placement, aim for 5+ elims + win
- **Divisional Cups:** Promotion every session (twice weekly) means more frequent opportunities
- **Practice Cups:** Use FNCS Divisional Practice Cups to prepare for major tournaments
- **Skin Cups:** Great for practice and cosmetics before Globals, mix of formats available

## Boon Strategy Tips
- **Agile Aiming:** Use for better accuracy while maintaining mobility in fights
- **Extended Magazine:** Prioritize for shotgun boxfights and AR spray situations
- **Storm Forecast:** Major advantage if available, but expect removal from competitive
- **Super Soldier S+:** Highest priority - infinite sprint gives massive mid/endgame advantage
- **O.X.R. Drop Pods:** Target these for Super Soldier boons, especially Rank S+

## Mythic & Medallion Strategy Tips
- **Enhanced Wrecker Revolver:** Potential shotgun replacement - test in creative first
- **Carapace Medallion:** Highest priority - 3 shield per second is game-changing
- **Springleg Medallion:** Use double jump for high ground retakes and escapes
- **Surge Medallion:** Combine with sliding for burst mobility advantage
- **O.X.R. Assault Rifle:** High-priority mythic for mid-range dominance

## Mobility Strategy Tips
- **Fizz + Crash Pads:** New meta standard - covers 130m for mid-game rotations
- **Fizz + Launch Pads:** Alternative for early game and high ground advantage
- **Crash Pads > Launch Pads:** No slow gliding, better for competitive play
- **Geysers:** Use for health recovery + mobility in early game
- **Every Team:** Prioritize Fizz for mobility advantage

## Competitive Loadout Tips
- **Sentinel Pump:** Best shotgun for competitive - reliable and consistent
- **Wrecker Revolver:** Test this yourself - could replace shotguns entirely
- **Hammer/Fury AR:** Better for boxfighting than O.X.R. Rifle in general play
- **Legendary Slurps:** Always take 2 if available - best healing in the game
- **Bug Blaster:** Great in team modes for destroying enemy builds

## O.X.R. Ranking Tips
- **Queen Elimination:** 650 points - highest value target in the game
- **POI Attacks:** 400 points - coordinate with team for maximum efficiency
- **Rift Pods:** 500 points - high-value objectives worth prioritizing
- **Rank-Based Targeting:** Eliminate higher-ranked players for more points
- **Storm Survival:** Late zones give more points - focus on survival in endgame

## O.X.R. Chest Tips
- **Guaranteed Loot:** Always get 2 consumables, 1 utility, 1 weapon (blue+ rarity), and ammo
- **Weapon Priority:** Wrecker Revolver and O.X.R. Rifle are high-value for competitive play
- **Healing Package:** Epic Slurp Juice is the best healing item in the game
- **Mobility Option:** Launch Pad provides safe rotation option
- **Boon Chance:** 12% chance of Extended Magazine Boon - valuable for competitive play
- **Strategic Value:** High-priority target for guaranteed high-tier loot

## Building Tips
- Practice building in Creative mode
- Learn quick edit patterns
- Use different materials strategically
- Don't waste materials on unnecessary builds

## Combat Tips
- Take your time with shots
- Use builds to create advantages
- Don't panic build
- Learn when to disengage

## Mental Game
- Stay calm under pressure
- Learn from every death
- Focus on improvement over wins
- Take breaks when tilted
`;

// Combine all documentation
export const getFullDocumentation = (): string => {
  return `${zoneGuides}\n\n${mechanics}\n\n${strategies}\n\n${metaAnalysis}\n\n${tipsAndTricks}`;
};

// Get specific sections
export const getDocumentationSection = (section: keyof AIDocumentation): string => {
  const sections = {
    zoneGuides,
    mechanics,
    strategies,
    metaAnalysis,
    tipsAndTricks
  };
  return sections[section] || '';
};

// Get documentation summary for AI context
export const getDocumentationSummary = (): string => {
  return `You are a Fortnite coaching AI with access to comprehensive game knowledge including:
- Zone management and rotation strategies with advanced prediction mechanics
- Chapter 6 Season 4 POI data (EU/NA servers) including loot, metal, competition, and survival rates
- Tournament strategy including trio surge mechanics, queue timing, points-based matchmaking, and decision-making
- Current tournament schedule and formats (FNCS Practice Cups, Duos Divisional, Solo Series, Reload Quick Cups)
- Specific upcoming tournament dates and overlapping schedule information
- Boon mechanics including Agile Aiming, Extended Magazine, Storm Forecast, and Super Soldier Ranked boons
- Chapter 6 Season 4 mythics and medallions including Enhanced Wrecker Revolver, O.X.R. Assault Rifle, Sweeper Shotgun, and mobility medallions
- New mobility system including Fizz, Crash Pads Jr, enhanced Launch Pads, and O.X.R. Drop Pod mechanics
- Competitive loot pool and loadout strategy including weapon priorities, mobility combinations, and healing item choices
- O.X.R. ranking system with points requirements, scoring mechanics, and ranking strategies for all game modes
- O.X.R. chest contents and guaranteed loot including weapons, consumables, utility items, and boon chances
- Core building and combat mechanics  
- Advanced fighting techniques and strategies
- Current meta analysis and weapon/item priorities
- Pro tips and mental game advice

Use this knowledge to provide personalized coaching based on the user's specific questions and context. You can now provide data-driven landing advice using specific POI statistics, advanced tournament strategy guidance, current tournament format information, specific tournament scheduling, boon strategy recommendations, mythic weapon guidance, medallion strategy, mobility system advice, competitive loadout recommendations, O.X.R. ranking strategies, and O.X.R. chest loot guidance.`;
};
