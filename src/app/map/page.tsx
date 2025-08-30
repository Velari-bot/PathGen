'use client';

import { useState, useEffect, useRef } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';

interface POILocation {
  id: string;
  name: string;
  type?: string;
  location: {
    x: number;
    y: number;
    z: number;
  };
  description?: string;
  lootQuality?: string;
  playerTraffic?: string;
  strategies?: {
    drop: string;
    rotation: string;
    endgame: string;
  };
}

interface CompetitiveData {
  region: string;
  description: string;
  pois: {
    name: string;
    loot: number;
    metal: number | string;
    avgTeams: number;
    survivalRate: number | string;
    overallRating?: number;
  }[];
}

interface RegionData {
  name: string;
  divisions: {
    name: string;
    data: CompetitiveData;
  }[];
}

interface MapData {
  images: {
    blank: string;
    pois: string;
  };
  pois: POILocation[];
}

export default function MapPage() {
  const [mapData, setMapData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPOI, setSelectedPOI] = useState<POILocation | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'competitive' | 'poi-analysis'>('poi-analysis');
  const [selectedRegion, setSelectedRegion] = useState<'EU' | 'NAC'>('NAC');
  const [selectedDivision, setSelectedDivision] = useState<string>('FNCS Div 1 NAC Week 1 Day 1');
  const [selectedPlayStyle, setSelectedPlayStyle] = useState<'aggressive' | 'passive' | 'balanced'>('balanced');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [mapPosition, setMapPosition] = useState({ x: 0, y: 0 });
  const [isDragEnabled, setIsDragEnabled] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [mapElements, setMapElements] = useState<any[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  
  // Drag state refs for smooth performance
  const isDown = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const raf = useRef(0);

  // Competitive data
  const competitiveData: CompetitiveData[] = [
    {
      region: '🏆 FNCS Div 1 NAC Week 1 Day 1',
      description: 'Professional Division 1 tournament data with comprehensive POI ratings based on loot, metal, contest, and survival metrics.',
      pois: [
        { name: 'Fighting Frogs', loot: 78, metal: 300, avgTeams: 1.34, survivalRate: 69, overallRating: 42 },
        { name: 'Yacht Stop', loot: 66, metal: 700, avgTeams: 1.40, survivalRate: 65, overallRating: 29 },
        { name: 'Martial Maneuvers', loot: 58, metal: 7500, avgTeams: 1.40, survivalRate: 65, overallRating: 38 },
        { name: 'First Order Base', loot: 49, metal: 8300, avgTeams: 1.38, survivalRate: 67, overallRating: 49 },
        { name: 'Supernova Academy', loot: 27, metal: 7700, avgTeams: 0.85, survivalRate: 60, overallRating: 18 },
        { name: 'Rocky Rus', loot: 11, metal: 600, avgTeams: 1.00, survivalRate: 65, overallRating: 82 },
        { name: 'Swarmy Stash', loot: 47, metal: 3200, avgTeams: 1.32, survivalRate: 67, overallRating: 42 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 0, metal: 3200, avgTeams: 0.71, survivalRate: 60, overallRating: 35 },
        { name: 'Pumpkin Pipes', loot: 61, metal: 3500, avgTeams: 1.47, survivalRate: 70, overallRating: 58 },
        { name: 'Open-Air Onsen', loot: 50, metal: 10000, avgTeams: 1.11, survivalRate: 65, overallRating: 52 },
        { name: 'Overlook Lighthouse', loot: 72, metal: 2000, avgTeams: 1.00, survivalRate: 65, overallRating: 61 },
        { name: 'Shining Span', loot: 50, metal: 6000, avgTeams: 0.98, survivalRate: 75, overallRating: 51 },
        { name: 'Salty Docks', loot: 24, metal: 1000, avgTeams: 0.87, survivalRate: 67, overallRating: 24 },
        { name: 'Kappa Kappa Factory', loot: 109, metal: 9300, avgTeams: 1.15, survivalRate: 69, overallRating: 109 },
        { name: 'Utopia City', loot: 109, metal: 9300, avgTeams: 1.31, survivalRate: 69, overallRating: 88 },
        { name: 'Rogue Slurp Room Market', loot: 30, metal: 3400, avgTeams: 1.18, survivalRate: 76, overallRating: 41 },
        { name: 'Rolling Blossoms Farm', loot: 68, metal: 2400, avgTeams: 1.00, survivalRate: 62, overallRating: 31 },
        { name: 'Way Station', loot: 50, metal: 6000, avgTeams: 1.10, survivalRate: 73, overallRating: 21 },
        { name: 'Outpost Enclave', loot: 47, metal: 2000, avgTeams: 0.97, survivalRate: 70, overallRating: 77 },
        { name: 'Kite\'s Flight', loot: 71, metal: 3300, avgTeams: 1.15, survivalRate: 69, overallRating: 72 },
        { name: 'The Great Turtle', loot: 74, metal: 100, avgTeams: 1.01, survivalRate: 67, overallRating: 27 },
        { name: 'Crabby Cove', loot: 57, metal: 2200, avgTeams: 0.96, survivalRate: 68, overallRating: 32 },
        { name: 'Canyon Crossing', loot: 63, metal: 5300, avgTeams: 0.91, survivalRate: 74, overallRating: 70 },
        { name: 'Predator Peak', loot: 57, metal: 2200, avgTeams: 0.96, survivalRate: 68, overallRating: 67 },
        { name: 'Big Bend', loot: 34, metal: 200, avgTeams: 0.98, survivalRate: 78, overallRating: 122 }
      ]
    },
    {
      region: '🥈 FNCS Div 2 NAC Week 1 Day 1',
      description: 'Division 2 tournament data showing competitive POI performance for mid-tier players.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 1.31, survivalRate: 55, overallRating: 33 },
        { name: 'Yacht Stop', loot: 66, metal: 700, avgTeams: 0.93, survivalRate: 69, overallRating: 44 },
        { name: 'Martial Maneuvers', loot: 52, metal: 700, avgTeams: 1.26, survivalRate: 62, overallRating: 42 },
        { name: 'First Order Base', loot: 27, metal: 7700, avgTeams: 0.85, survivalRate: 60, overallRating: 18 },
        { name: 'Supernova Academy', loot: 11, metal: 600, avgTeams: 1.00, survivalRate: 65, overallRating: 97 },
        { name: 'Rocky Rus', loot: 61, metal: 3500, avgTeams: 0.99, survivalRate: 79, overallRating: 85 },
        { name: 'Swarmy Stash', loot: 47, metal: 3200, avgTeams: 1.28, survivalRate: 72, overallRating: 54 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 0, metal: 3200, avgTeams: 1.28, survivalRate: 72, overallRating: 35 },
        { name: 'Pumpkin Pipes', loot: 50, metal: 10000, avgTeams: 1.23, survivalRate: 61, overallRating: 41 },
        { name: 'Open-Air Onsen', loot: 72, metal: 2600, avgTeams: 1.06, survivalRate: 72, overallRating: 54 },
        { name: 'Shining Span', loot: 50, metal: 6000, avgTeams: 0.68, survivalRate: 64, overallRating: 51 },
        { name: 'Salty Docks', loot: 24, metal: 1000, avgTeams: 0.87, survivalRate: 67, overallRating: 24 },
        { name: 'Kappa Kappa Factory', loot: 109, metal: 9300, avgTeams: 1.15, survivalRate: 69, overallRating: 64 },
        { name: 'Utopia City', loot: 30, metal: 3400, avgTeams: 1.30, survivalRate: 62, overallRating: 30 },
        { name: 'Rogue Slurp Room Market', loot: 40, metal: 2100, avgTeams: 0.74, survivalRate: 60, overallRating: 49 },
        { name: 'Rolling Blossoms Farm', loot: 50, metal: 6000, avgTeams: 1.05, survivalRate: 65, overallRating: 41 },
        { name: 'Way Station', loot: 50, metal: 6000, avgTeams: 1.10, survivalRate: 73, overallRating: 30 },
        { name: 'Outpost Enclave', loot: 47, metal: 2000, avgTeams: 0.96, survivalRate: 68, overallRating: 102 },
        { name: 'Kite\'s Flight', loot: 71, metal: 3300, avgTeams: 1.15, survivalRate: 69, overallRating: 54 },
        { name: 'The Great Turtle', loot: 74, metal: 100, avgTeams: 1.01, survivalRate: 67, overallRating: 18 },
        { name: 'Crabby Cove', loot: 57, metal: 2200, avgTeams: 0.96, survivalRate: 68, overallRating: 32 },
        { name: 'Canyon Crossing', loot: 34, metal: 200, avgTeams: 0.23, survivalRate: 71, overallRating: 60 }
      ]
    },
    {
      region: '🥉 FNCS Div 3 NAC Week 1 Day 1',
      description: 'Division 3 tournament data for developing players with strategic POI insights.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 1.31, survivalRate: 60, overallRating: 30 },
        { name: 'Yacht Stop', loot: 66, metal: 700, avgTeams: 0.93, survivalRate: 69, overallRating: 49 },
        { name: 'Martial Maneuvers', loot: 58, metal: 7500, avgTeams: 1.40, survivalRate: 65, overallRating: 38 },
        { name: 'First Order Base', loot: 27, metal: 7700, avgTeams: 0.85, survivalRate: 60, overallRating: 14 },
        { name: 'Supernova Academy', loot: 11, metal: 600, avgTeams: 1.00, survivalRate: 65, overallRating: 107 },
        { name: 'Rocky Rus', loot: 61, metal: 3500, avgTeams: 1.23, survivalRate: 71, overallRating: 64 },
        { name: 'Swarmy Stash', loot: 47, metal: 3200, avgTeams: 0.96, survivalRate: 60, overallRating: 54 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 81, metal: 0, avgTeams: 1.18, survivalRate: 53, overallRating: 38 },
        { name: 'Pumpkin Pipes', loot: 50, metal: 10000, avgTeams: 0.93, survivalRate: 67, overallRating: 60 },
        { name: 'Open-Air Onsen', loot: 56, metal: 3000, avgTeams: 1.28, survivalRate: 61, overallRating: 56 },
        { name: 'Shining Span', loot: 72, metal: 2600, avgTeams: 1.19, survivalRate: 65, overallRating: 84 },
        { name: 'Salty Docks', loot: 50, metal: 6000, avgTeams: 0.98, survivalRate: 75, overallRating: 50 },
        { name: 'Kappa Kappa Factory', loot: 72, metal: 2600, avgTeams: 0.92, survivalRate: 67, overallRating: 116 },
        { name: 'Utopia City', loot: 109, metal: 9300, avgTeams: 0.94, survivalRate: 53, overallRating: 68 },
        { name: 'Rogue Slurp Room Market', loot: 109, metal: 9300, avgTeams: 1.22, survivalRate: 59, overallRating: 89 },
        { name: 'Way Station', loot: 30, metal: 3400, avgTeams: 1.34, survivalRate: 60, overallRating: 51 },
        { name: 'Rolling Blossoms Farm', loot: 54, metal: 10000, avgTeams: 1.34, survivalRate: 60, overallRating: 39 },
        { name: 'Outpost Enclave', loot: 40, metal: 2600, avgTeams: 0.82, survivalRate: 62, overallRating: 50 },
        { name: 'Kite\'s Flight', loot: 65, metal: 2400, avgTeams: 1.00, survivalRate: 68, overallRating: 34 },
        { name: 'The Great Turtle', loot: 50, metal: 6000, avgTeams: 1.10, survivalRate: 73, overallRating: 19 },
        { name: 'Crabby Cove', loot: 47, metal: 2000, avgTeams: 0.80, survivalRate: 66, overallRating: 65 },
        { name: 'Canyon Crossing', loot: 57, metal: 2200, avgTeams: 0.96, survivalRate: 68, overallRating: 37 },
        { name: 'Predator Peak', loot: 53, metal: 5300, avgTeams: 0.88, survivalRate: 70, overallRating: 76 },
        { name: 'Big Bend', loot: 34, metal: 200, avgTeams: 0.20, survivalRate: 73, overallRating: 70 },
        { name: 'Yōkina Boardwalk', loot: 47, metal: 2000, avgTeams: 0.61, survivalRate: 71, overallRating: 80 },
        { name: 'Sakura Stadium', loot: 71, metal: 3300, avgTeams: 0.48, survivalRate: 67, overallRating: 71 },
        { name: 'Placid Paddies', loot: 63, metal: 5300, avgTeams: 0.88, survivalRate: 70, overallRating: 49 },
        { name: 'Foxy Floodgate', loot: 74, metal: 100, avgTeams: 1.01, survivalRate: 67, overallRating: 22 }
      ]
    },
    {
      region: '🎯 Trio Loot + Metal Evaluation',
      description: 'Specialized evaluation focusing on loot and metal resources for trio gameplay optimization.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 0, survivalRate: 0, overallRating: 42 },
        { name: 'Yacht Stop', loot: 49, metal: 8300, avgTeams: 0, survivalRate: 0, overallRating: 61 },
        { name: 'Martial Maneuvers', loot: 71, metal: 300, avgTeams: 0, survivalRate: 0, overallRating: 43 },
        { name: 'First Order Base', loot: 58, metal: 7500, avgTeams: 0, survivalRate: 0, overallRating: 48 },
        { name: 'Supernova Academy', loot: 58, metal: 7500, avgTeams: 0, survivalRate: 0, overallRating: 39 },
        { name: 'Rocky Rus', loot: 57, metal: 3500, avgTeams: 0, survivalRate: 0, overallRating: 70 },
        { name: 'Swarmy Stash', loot: 32, metal: 3200, avgTeams: 0, survivalRate: 0, overallRating: 38 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 48, metal: 600, avgTeams: 0, survivalRate: 0, overallRating: 48 },
        { name: 'Pumpkin Pipes', loot: 27, metal: 7700, avgTeams: 0, survivalRate: 0, overallRating: 33 },
        { name: 'Open-Air Onsen', loot: 27, metal: 7700, avgTeams: 0, survivalRate: 0, overallRating: 22 },
        { name: 'Shining Span', loot: 53, metal: 3000, avgTeams: 0, survivalRate: 0, overallRating: 41 },
        { name: 'Salty Docks', loot: 53, metal: 3000, avgTeams: 0, survivalRate: 0, overallRating: 41 },
        { name: 'Kappa Kappa Factory', loot: 49, metal: 9600, avgTeams: 0, survivalRate: 0, overallRating: 62 },
        { name: 'Utopia City', loot: 102, metal: 8300, avgTeams: 0, survivalRate: 0, overallRating: 102 },
        { name: 'Rogue Slurp Room Market', loot: 38, metal: 3400, avgTeams: 0, survivalRate: 0, overallRating: 47 },
        { name: 'Rolling Blossoms Farm', loot: 53, metal: 10000, avgTeams: 0, survivalRate: 0, overallRating: 66 },
        { name: 'Way Station', loot: 38, metal: 2600, avgTeams: 0, survivalRate: 0, overallRating: 44 },
        { name: 'Outpost Enclave', loot: 50, metal: 2400, avgTeams: 0, survivalRate: 0, overallRating: 55 },
        { name: 'Kite\'s Flight', loot: 50, metal: 6000, avgTeams: 0, survivalRate: 0, overallRating: 62 },
        { name: 'The Great Turtle', loot: 46, metal: 2000, avgTeams: 0, survivalRate: 0, overallRating: 48 },
        { name: 'Crabby Cove', loot: 50, metal: 3300, avgTeams: 0, survivalRate: 0, overallRating: 71 },
        { name: 'Canyon Crossing', loot: 50, metal: 2400, avgTeams: 0, survivalRate: 0, overallRating: 42 },
        { name: 'Predator Peak', loot: 40, metal: 6000, avgTeams: 0, survivalRate: 0, overallRating: 40 },
        { name: 'Big Bend', loot: 53, metal: 2200, avgTeams: 0, survivalRate: 0, overallRating: 57 },
        { name: 'Yōkina Boardwalk', loot: 53, metal: 5300, avgTeams: 0, survivalRate: 0, overallRating: 66 },
        { name: 'Placid Paddies', loot: 34, metal: 200, avgTeams: 0, survivalRate: 0, overallRating: 19 }
      ]
    },
    {
      region: '🏅 NAC #2 Top 1000 Evaluation',
      description: 'Elite Top 1000 player evaluation showing highest level competitive POI performance.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 0.92, survivalRate: 75, overallRating: 67 },
        { name: 'Yacht Stop', loot: 66, metal: 700, avgTeams: 1.23, survivalRate: 72, overallRating: 41 },
        { name: 'Martial Maneuvers', loot: 60, metal: 700, avgTeams: 1.23, survivalRate: 72, overallRating: 20 },
        { name: 'First Order Base', loot: 50, metal: 6000, avgTeams: 1.51, survivalRate: 40, overallRating: 46 },
        { name: 'Supernova Academy', loot: 27, metal: 7700, avgTeams: 1.11, survivalRate: 65, overallRating: 77 },
        { name: 'Rocky Rus', loot: 27, metal: 7700, avgTeams: 1.11, survivalRate: 65, overallRating: 11 },
        { name: 'Swarmy Stash', loot: 57, metal: 3500, avgTeams: 0.89, survivalRate: 71, overallRating: 78 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 50, metal: 10000, avgTeams: 0.82, survivalRate: 72, overallRating: 69 },
        { name: 'Pumpkin Pipes', loot: 50, metal: 6000, avgTeams: 1.24, survivalRate: 59, overallRating: 33 },
        { name: 'Open-Air Onsen', loot: 72, metal: 2600, avgTeams: 1.24, survivalRate: 59, overallRating: 56 },
        { name: 'Shining Span', loot: 54, metal: 3000, avgTeams: 0.82, survivalRate: 72, overallRating: 41 },
        { name: 'Salty Docks', loot: 24, metal: 1900, avgTeams: 1.14, survivalRate: 77, overallRating: 24 },
        { name: 'Kappa Kappa Factory', loot: 109, metal: 9300, avgTeams: 1.14, survivalRate: 77, overallRating: 28 },
        { name: 'Utopia City', loot: 109, metal: 9300, avgTeams: 1.14, survivalRate: 77, overallRating: 120 },
        { name: 'Rogue Slurp Room Market', loot: 38, metal: 3400, avgTeams: 1.20, survivalRate: 67, overallRating: 120 },
        { name: 'Rolling Blossoms Farm', loot: 40, metal: 2100, avgTeams: 1.39, survivalRate: 67, overallRating: 40 },
        { name: 'Way Station', loot: 61, metal: 3500, avgTeams: 0.89, survivalRate: 71, overallRating: 78 },
        { name: 'Outpost Enclave', loot: 40, metal: 2100, avgTeams: 1.20, survivalRate: 67, overallRating: 68 },
        { name: 'Kite\'s Flight', loot: 120, metal: 0, avgTeams: 1.07, survivalRate: 67, overallRating: 23 },
        { name: 'The Great Turtle', loot: 43, metal: 6000, avgTeams: 1.39, survivalRate: 67, overallRating: 43 },
        { name: 'Crabby Cove', loot: 50, metal: 6000, avgTeams: 1.39, survivalRate: 67, overallRating: 19 },
        { name: 'Canyon Crossing', loot: 53, metal: 5300, avgTeams: 1.22, survivalRate: 64, overallRating: 53 },
        { name: 'Predator Peak', loot: 57, metal: 2200, avgTeams: 1.26, survivalRate: 68, overallRating: 65 },
        { name: 'Big Bend', loot: 112, metal: 8300, avgTeams: 0.99, survivalRate: 69, overallRating: 112 },
        { name: 'Yōkina Boardwalk', loot: 34, metal: 200, avgTeams: 0.13, survivalRate: 100, overallRating: 126 }
      ]
    },
    {
      region: '🌟 NAC #1 Evaluation',
      description: 'Comprehensive NAC #1 evaluation with strategic insights for competitive play.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 1.39, survivalRate: 52, overallRating: 38 },
        { name: 'Yacht Stop', loot: 52, metal: 700, avgTeams: 1.26, survivalRate: 49, overallRating: 28 },
        { name: 'Martial Maneuvers', loot: 57, metal: 3500, avgTeams: 1.53, survivalRate: 63, overallRating: 53 },
        { name: 'First Order Base', loot: 49, metal: 3200, avgTeams: 1.13, survivalRate: 57, overallRating: 50 },
        { name: 'Supernova Academy', loot: 66, metal: 700, avgTeams: 1.26, survivalRate: 56, overallRating: 44 },
        { name: 'Rocky Rus', loot: 27, metal: 7700, avgTeams: 0.85, survivalRate: 60, overallRating: 19 },
        { name: 'Swarmy Stash', loot: 40, metal: 11600, avgTeams: 1.00, survivalRate: 65, overallRating: 72 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 53, metal: 10000, avgTeams: 1.01, survivalRate: 56, overallRating: 55 },
        { name: 'Pumpkin Pipes', loot: 53, metal: 3000, avgTeams: 1.01, survivalRate: 56, overallRating: 74 },
        { name: 'Open-Air Onsen', loot: 56, metal: 3000, avgTeams: 1.28, survivalRate: 61, overallRating: 36 },
        { name: 'Shining Span', loot: 39, metal: 2600, avgTeams: 1.01, survivalRate: 53, overallRating: 39 },
        { name: 'Salty Docks', loot: 101, metal: 9300, avgTeams: 0.96, survivalRate: 58, overallRating: 121 },
        { name: 'Kappa Kappa Factory', loot: 38, metal: 3400, avgTeams: 1.23, survivalRate: 61, overallRating: 29 },
        { name: 'Utopia City', loot: 50, metal: 2400, avgTeams: 1.42, survivalRate: 54, overallRating: 55 },
        { name: 'Rogue Slurp Room Market', loot: 46, metal: 2000, avgTeams: 0.54, survivalRate: 59, overallRating: 48 },
        { name: 'Rolling Blossoms Farm', loot: 50, metal: 6000, avgTeams: 1.24, survivalRate: 51, overallRating: 40 },
        { name: 'Way Station', loot: 48, metal: 2000, avgTeams: 0.94, survivalRate: 59, overallRating: 77 },
        { name: 'Outpost Enclave', loot: 71, metal: 3300, avgTeams: 1.26, survivalRate: 68, overallRating: 62 },
        { name: 'Kite\'s Flight', loot: 40, metal: 2100, avgTeams: 1.20, survivalRate: 67, overallRating: 37 },
        { name: 'The Great Turtle', loot: 120, metal: 0, avgTeams: 1.07, survivalRate: 67, overallRating: 22 },
        { name: 'Crabby Cove', loot: 41, metal: 2200, avgTeams: 1.57, survivalRate: 53, overallRating: 41 },
        { name: 'Canyon Crossing', loot: 70, metal: 200, avgTeams: 0.24, survivalRate: 73, overallRating: 70 },
        { name: 'Predator Peak', loot: 53, metal: 5300, avgTeams: 0.97, survivalRate: 54, overallRating: 56 }
      ]
    }
  ];

  // EU Competitive data
  const euCompetitiveData: CompetitiveData[] = [
    {
      region: '🏆 FNCS Div 1 EU Week 1 Day 1',
      description: 'Professional Division 1 tournament data for European region with comprehensive POI ratings.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 1.02, survivalRate: 70, overallRating: 62 },
        { name: 'Yacht Stop', loot: 78, metal: 300, avgTeams: 1.51, survivalRate: 59, overallRating: 29 },
        { name: 'Martial Maneuvers', loot: 55, metal: 700, avgTeams: 1.27, survivalRate: 59, overallRating: 32 },
        { name: 'First Order Base', loot: 56, metal: 7500, avgTeams: 1.49, survivalRate: 68, overallRating: 52 },
        { name: 'Supernova Academy', loot: 47, metal: 3200, avgTeams: 0.84, survivalRate: 67, overallRating: 63 },
        { name: 'Rocky Rus', loot: 81, metal: 600, avgTeams: 1.41, survivalRate: 55, overallRating: 36 },
        { name: 'Swarmy Stash', loot: 27, metal: 7700, avgTeams: 1.88, survivalRate: 61, overallRating: 18 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 38, metal: 1600, avgTeams: 0.29, survivalRate: 61, overallRating: 75 },
        { name: 'Pumpkin Pipes', loot: 50, metal: 10000, avgTeams: 1.00, survivalRate: 67, overallRating: 60 },
        { name: 'Open-Air Onsen', loot: 61, metal: 3500, avgTeams: 1.35, survivalRate: 68, overallRating: 61 },
        { name: 'Shining Span', loot: 55, metal: 9600, avgTeams: 1.12, survivalRate: 61, overallRating: 53 },
        { name: 'Salty Docks', loot: 72, metal: 2600, avgTeams: 1.39, survivalRate: 56, overallRating: 52 },
        { name: 'Kappa Kappa Factory', loot: 56, metal: 3000, avgTeams: 0.86, survivalRate: 64, overallRating: 70 },
        { name: 'Utopia City', loot: 38, metal: 3400, avgTeams: 1.16, survivalRate: 64, overallRating: 39 },
        { name: 'Rogue Slurp Room Market', loot: 53, metal: 10000, avgTeams: 1.04, survivalRate: 77, overallRating: 76 },
        { name: 'Rolling Blossoms Farm', loot: 40, metal: 2600, avgTeams: 1.02, survivalRate: 59, overallRating: 39 },
        { name: 'Way Station', loot: 24, metal: 1900, avgTeams: 1.06, survivalRate: 52, overallRating: 19 },
        { name: 'Outpost Enclave', loot: 109, metal: 9300, avgTeams: 1.41, survivalRate: 61, overallRating: 89 },
        { name: 'Kite\'s Flight', loot: 40, metal: 2100, avgTeams: 1.10, survivalRate: 77, overallRating: 49 },
        { name: 'The Great Turtle', loot: 56, metal: 3000, avgTeams: 0.81, survivalRate: 68, overallRating: 89 },
        { name: 'Crabby Cove', loot: 38, metal: 1600, avgTeams: 0.48, survivalRate: 24, overallRating: 17 },
        { name: 'Canyon Crossing', loot: 50, metal: 10000, avgTeams: 0.95, survivalRate: 63, overallRating: 64 },
        { name: 'Predator Peak', loot: 53, metal: 10000, avgTeams: 1.44, survivalRate: 68, overallRating: 56 },
        { name: 'Big Bend', loot: 61, metal: 3500, avgTeams: 1.09, survivalRate: 74, overallRating: 91 },
        { name: 'Yōkina Boardwalk', loot: 40, metal: 2600, avgTeams: 0.94, survivalRate: 56, overallRating: 43 },
        { name: 'Sakura Stadium', loot: 55, metal: 2400, avgTeams: 1.65, survivalRate: 72, overallRating: 41 },
        { name: 'Placid Paddies', loot: 50, metal: 6000, avgTeams: 1.41, survivalRate: 55, overallRating: 35 },
        { name: 'Foxy Floodgate', loot: 46, metal: 2000, avgTeams: 0.69, survivalRate: 56, overallRating: 54 },
        { name: 'Base Tunnel', loot: 59, metal: 3300, avgTeams: 1.38, survivalRate: 67, overallRating: 73 },
        { name: 'Mine Entrance 2', loot: 40, metal: 2100, avgTeams: 0.74, survivalRate: 80, overallRating: 68 },
        { name: 'Mine Entrance 3', loot: 74, metal: 500, avgTeams: 1.14, survivalRate: 54, overallRating: 37 },
        { name: 'All You Can Catch!', loot: 48, metal: 200, avgTeams: 1.53, survivalRate: 54, overallRating: 14 },
        { name: 'Resistance Base', loot: 53, metal: 5300, avgTeams: 1.08, survivalRate: 65, overallRating: 57 },
        { name: 'O.X.R. HQ', loot: 34, metal: 200, avgTeams: 0.31, survivalRate: 80, overallRating: 64 }
      ]
    },
    {
      region: '🥈 FNCS Div 2 EU Week 1 Day 1',
      description: 'Division 2 tournament data for European mid-tier players with strategic insights.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 1.05, survivalRate: 52, overallRating: 44 },
        { name: 'Yacht Stop', loot: 78, metal: 300, avgTeams: 1.86, survivalRate: 36, overallRating: 15 },
        { name: 'Martial Maneuvers', loot: 55, metal: 700, avgTeams: 1.89, survivalRate: 34, overallRating: 12 },
        { name: 'First Order Base', loot: 56, metal: 7500, avgTeams: 1.66, survivalRate: 60, overallRating: 45 },
        { name: 'Supernova Academy', loot: 47, metal: 3200, avgTeams: 1.16, survivalRate: 75, overallRating: 54 },
        { name: 'Rocky Rus', loot: 81, metal: 600, avgTeams: 1.15, survivalRate: 54, overallRating: 39 },
        { name: 'Swarmy Stash', loot: 27, metal: 7700, avgTeams: 1.69, survivalRate: 53, overallRating: 14 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 38, metal: 1600, avgTeams: 0.32, survivalRate: 68, overallRating: 77 },
        { name: 'Pumpkin Pipes', loot: 50, metal: 10000, avgTeams: 1.00, survivalRate: 67, overallRating: 60 },
        { name: 'Open-Air Onsen', loot: 61, metal: 3500, avgTeams: 1.35, survivalRate: 68, overallRating: 61 },
        { name: 'Shining Span', loot: 55, metal: 9600, avgTeams: 1.21, survivalRate: 71, overallRating: 58 },
        { name: 'Salty Docks', loot: 72, metal: 2600, avgTeams: 0.53, survivalRate: 65, overallRating: 108 },
        { name: 'Kappa Kappa Factory', loot: 56, metal: 3000, avgTeams: 0.90, survivalRate: 63, overallRating: 59 },
        { name: 'Utopia City', loot: 38, metal: 3400, avgTeams: 1.16, survivalRate: 64, overallRating: 39 },
        { name: 'Rogue Slurp Room Market', loot: 53, metal: 10000, avgTeams: 1.04, survivalRate: 77, overallRating: 76 },
        { name: 'Rolling Blossoms Farm', loot: 40, metal: 2600, avgTeams: 1.02, survivalRate: 59, overallRating: 39 },
        { name: 'Way Station', loot: 24, metal: 1900, avgTeams: 1.06, survivalRate: 52, overallRating: 19 },
        { name: 'Outpost Enclave', loot: 109, metal: 9300, avgTeams: 1.41, survivalRate: 61, overallRating: 89 },
        { name: 'Kite\'s Flight', loot: 40, metal: 2100, avgTeams: 1.10, survivalRate: 77, overallRating: 49 },
        { name: 'The Great Turtle', loot: 56, metal: 3000, avgTeams: 0.81, survivalRate: 68, overallRating: 89 },
        { name: 'Crabby Cove', loot: 38, metal: 1600, avgTeams: 0.48, survivalRate: 24, overallRating: 17 },
        { name: 'Canyon Crossing', loot: 50, metal: 10000, avgTeams: 0.95, survivalRate: 63, overallRating: 64 },
        { name: 'Predator Peak', loot: 53, metal: 10000, avgTeams: 1.44, survivalRate: 68, overallRating: 56 },
        { name: 'Big Bend', loot: 61, metal: 3500, avgTeams: 1.09, survivalRate: 74, overallRating: 91 },
        { name: 'Yōkina Boardwalk', loot: 40, metal: 2600, avgTeams: 0.94, survivalRate: 56, overallRating: 43 },
        { name: 'Sakura Stadium', loot: 55, metal: 2400, avgTeams: 1.65, survivalRate: 72, overallRating: 41 },
        { name: 'Placid Paddies', loot: 50, metal: 6000, avgTeams: 1.41, survivalRate: 55, overallRating: 35 },
        { name: 'Foxy Floodgate', loot: 46, metal: 2000, avgTeams: 0.69, survivalRate: 56, overallRating: 54 },
        { name: 'Base Tunnel', loot: 59, metal: 3300, avgTeams: 1.38, survivalRate: 67, overallRating: 73 },
        { name: 'Mine Entrance 2', loot: 40, metal: 2100, avgTeams: 0.74, survivalRate: 80, overallRating: 68 },
        { name: 'Mine Entrance 3', loot: 74, metal: 500, avgTeams: 1.14, survivalRate: 54, overallRating: 37 },
        { name: 'All You Can Catch!', loot: 48, metal: 200, avgTeams: 1.53, survivalRate: 54, overallRating: 14 },
        { name: 'Resistance Base', loot: 53, metal: 5300, avgTeams: 1.08, survivalRate: 65, overallRating: 57 },
        { name: 'O.X.R. HQ', loot: 34, metal: 200, avgTeams: 0.31, survivalRate: 80, overallRating: 64 }
      ]
    },
    {
      region: '🥉 FNCS Div 3 EU Week 1 Day 1',
      description: 'Division 3 tournament data for European developing players with competitive analysis.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 1.40, survivalRate: 62, overallRating: 38 },
        { name: 'Yacht Stop', loot: 78, metal: 300, avgTeams: 1.08, survivalRate: 72, overallRating: 47 },
        { name: 'Martial Maneuvers', loot: 55, metal: 700, avgTeams: 1.11, survivalRate: 73, overallRating: 42 },
        { name: 'First Order Base', loot: 56, metal: 7500, avgTeams: 1.34, survivalRate: 62, overallRating: 45 },
        { name: 'Supernova Academy', loot: 47, metal: 3200, avgTeams: 1.16, survivalRate: 75, overallRating: 54 },
        { name: 'Rocky Rus', loot: 81, metal: 600, avgTeams: 1.15, survivalRate: 54, overallRating: 39 },
        { name: 'Swarmy Stash', loot: 27, metal: 7700, avgTeams: 1.69, survivalRate: 53, overallRating: 14 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 38, metal: 1600, avgTeams: 0.32, survivalRate: 68, overallRating: 77 },
        { name: 'Pumpkin Pipes', loot: 50, metal: 10000, avgTeams: 1.00, survivalRate: 67, overallRating: 60 },
        { name: 'Open-Air Onsen', loot: 61, metal: 3500, avgTeams: 1.35, survivalRate: 68, overallRating: 61 },
        { name: 'Shining Span', loot: 55, metal: 9600, avgTeams: 1.21, survivalRate: 71, overallRating: 58 },
        { name: 'Salty Docks', loot: 72, metal: 2600, avgTeams: 0.53, survivalRate: 65, overallRating: 108 },
        { name: 'Kappa Kappa Factory', loot: 56, metal: 3000, avgTeams: 0.90, survivalRate: 63, overallRating: 59 },
        { name: 'Utopia City', loot: 38, metal: 3400, avgTeams: 1.16, survivalRate: 64, overallRating: 39 },
        { name: 'Rogue Slurp Room Market', loot: 53, metal: 10000, avgTeams: 1.04, survivalRate: 77, overallRating: 76 },
        { name: 'Rolling Blossoms Farm', loot: 40, metal: 2600, avgTeams: 1.02, survivalRate: 59, overallRating: 39 },
        { name: 'Way Station', loot: 24, metal: 1900, avgTeams: 1.06, survivalRate: 52, overallRating: 19 },
        { name: 'Outpost Enclave', loot: 109, metal: 9300, avgTeams: 1.41, survivalRate: 61, overallRating: 89 },
        { name: 'Kite\'s Flight', loot: 40, metal: 2100, avgTeams: 1.10, survivalRate: 77, overallRating: 49 },
        { name: 'The Great Turtle', loot: 56, metal: 3000, avgTeams: 0.81, survivalRate: 68, overallRating: 89 },
        { name: 'Crabby Cove', loot: 38, metal: 1600, avgTeams: 0.48, survivalRate: 24, overallRating: 17 },
        { name: 'Canyon Crossing', loot: 50, metal: 10000, avgTeams: 0.95, survivalRate: 63, overallRating: 64 },
        { name: 'Predator Peak', loot: 53, metal: 10000, avgTeams: 1.44, survivalRate: 68, overallRating: 56 },
        { name: 'Big Bend', loot: 61, metal: 3500, avgTeams: 1.09, survivalRate: 74, overallRating: 91 },
        { name: 'Yōkina Boardwalk', loot: 40, metal: 2600, avgTeams: 0.94, survivalRate: 56, overallRating: 43 },
        { name: 'Sakura Stadium', loot: 55, metal: 2400, avgTeams: 1.65, survivalRate: 72, overallRating: 41 },
        { name: 'Placid Paddies', loot: 50, metal: 6000, avgTeams: 1.41, survivalRate: 55, overallRating: 35 },
        { name: 'Foxy Floodgate', loot: 46, metal: 2000, avgTeams: 0.69, survivalRate: 56, overallRating: 54 },
        { name: 'Base Tunnel', loot: 59, metal: 3300, avgTeams: 1.38, survivalRate: 67, overallRating: 73 },
        { name: 'Mine Entrance 2', loot: 40, metal: 2100, avgTeams: 0.74, survivalRate: 80, overallRating: 68 },
        { name: 'Mine Entrance 3', loot: 74, metal: 500, avgTeams: 1.14, survivalRate: 54, overallRating: 37 },
        { name: 'All You Can Catch!', loot: 48, metal: 200, avgTeams: 1.53, survivalRate: 54, overallRating: 14 },
        { name: 'Resistance Base', loot: 53, metal: 5300, avgTeams: 1.08, survivalRate: 65, overallRating: 57 },
        { name: 'O.X.R. HQ', loot: 34, metal: 200, avgTeams: 0.31, survivalRate: 80, overallRating: 64 }
      ]
    },
    {
      region: '📊 EU Eval',
      description: 'European evaluation data with comprehensive POI analysis for competitive play.',
      pois: [
        { name: 'Fighting Frogs', loot: 49, metal: 8300, avgTeams: 1.25, survivalRate: 45, overallRating: 36 },
        { name: 'Yacht Stop', loot: 71, metal: 300, avgTeams: 1.65, survivalRate: 58, overallRating: 31 },
        { name: 'Martial Maneuvers', loot: 52, metal: 700, avgTeams: 1.59, survivalRate: 46, overallRating: 23 },
        { name: 'First Order Base', loot: 56, metal: 7500, avgTeams: 1.28, survivalRate: 55, overallRating: 54 },
        { name: 'Supernova Academy', loot: 32, metal: 3200, avgTeams: 0.81, survivalRate: 64, overallRating: 53 },
        { name: 'Rocky Rus', loot: 66, metal: 600, avgTeams: 1.00, survivalRate: 66, overallRating: 36 },
        { name: 'Swarmy Stash', loot: 27, metal: 7700, avgTeams: 1.63, survivalRate: 54, overallRating: 18 },
        { name: 'O.Z.P. HQ Base Tunnel', loot: 23, metal: 1600, avgTeams: 0.32, survivalRate: 46, overallRating: 75 },
        { name: 'Pumpkin Pipes', loot: 61, metal: 3500, avgTeams: 1.30, survivalRate: 65, overallRating: 71 },
        { name: 'Open-Air Onsen', loot: 55, metal: 9600, avgTeams: 1.12, survivalRate: 61, overallRating: 53 },
        { name: 'Shining Span', loot: 72, metal: 2600, avgTeams: 1.39, survivalRate: 56, overallRating: 52 },
        { name: 'Salty Docks', loot: 56, metal: 3000, avgTeams: 0.86, survivalRate: 64, overallRating: 70 },
        { name: 'Kappa Kappa Factory', loot: 50, metal: 10, avgTeams: 0.99, survivalRate: 64, overallRating: 48 },
        { name: 'Utopia City', loot: 53, metal: 10, avgTeams: 0.91, survivalRate: 72, overallRating: 97 },
        { name: 'Rogue Slurp Room Market', loot: 39, metal: 2600, avgTeams: 0.91, survivalRate: 66, overallRating: 63 },
        { name: 'Rolling Blossoms Farm', loot: 82, metal: 9300, avgTeams: 1.17, survivalRate: 60, overallRating: 98 },
        { name: 'Way Station', loot: 38, metal: 3400, avgTeams: 1.09, survivalRate: 59, overallRating: 46 },
        { name: 'Outpost Enclave', loot: 50, metal: 2400, avgTeams: 1.74, survivalRate: 62, overallRating: 40 },
        { name: 'Kite\'s Flight', loot: 50, metal: 6000, avgTeams: 1.57, survivalRate: 53, overallRating: 40 },
        { name: 'The Great Turtle', loot: 46, metal: 2000, avgTeams: 0.83, survivalRate: 50, overallRating: 52 },
        { name: 'Crabby Cove', loot: 59, metal: 3300, avgTeams: 1.38, survivalRate: 67, overallRating: 73 },
        { name: 'Canyon Crossing', loot: 40, metal: 2100, avgTeams: 1.06, survivalRate: 62, overallRating: 51 },
        { name: 'Predator Peak', loot: 74, metal: 500, avgTeams: 1.14, survivalRate: 54, overallRating: 37 },
        { name: 'Big Bend', loot: 53, metal: 2200, avgTeams: 1.37, survivalRate: 41, overallRating: 31 },
        { name: 'Yōkina Boardwalk', loot: 48, metal: 200, avgTeams: 1.33, survivalRate: 54, overallRating: 21 },
        { name: 'Sakura Stadium', loot: 53, metal: 5300, avgTeams: 1.30, survivalRate: 48, overallRating: 42 },
        { name: 'Placid Paddies', loot: 34, metal: 200, avgTeams: 0.30, survivalRate: 49, overallRating: 47 }
      ]
    }
  ];

  useEffect(() => {
    const fetchMapData = async () => {
      try {
        const response = await fetch('https://fortnite-api.com/v1/map');
        if (!response.ok) {
          throw new Error('Failed to fetch map data');
        }
        const data = await response.json();
        
        // Enhance POI data with loot spawns and strategic info
        const enhancedPOIs = data.data.pois.map((poi: any) => ({
          ...poi,
          description: generateDescription(poi.name, poi.id),
          lootQuality: generateLootQuality(poi.id),
          playerTraffic: generatePlayerTraffic(poi.id),
          strategies: generateStrategies(poi.name, poi.id)
        }));
        
        setMapData({
          ...data.data,
          pois: enhancedPOIs
        });
      setLoading(false);
      } catch (error) {
        console.error('Error fetching map data:', error);
        setError('Failed to load map data');
      setLoading(false);
    }
  };

    fetchMapData();
  }, []);

  const getPOIType = (id: string): string => {
    if (id.includes('GasStation')) return 'Gas Station';
    if (id.includes('Landmark')) return 'Landmark';
    if (id.includes('POI.Generic')) return 'Named Location';
    if (id.includes('Quest')) return 'Quest Location';
    return 'Unknown';
  };

  const generateDescription = (name: string, id: string): string => {
    const descriptions = {
      'Gas Station': 'Refuel and resupply location with medium-tier loot',
      'Landmark': 'Notable location with unique features and loot',
      'Named Location': 'Major POI with high-tier loot and strategic value',
      'Quest Location': 'Special location for seasonal quests and challenges'
    };
    
    const type = getPOIType(id);
    return descriptions[type as keyof typeof descriptions] || 'Strategic location with loot and resources';
  };

  const generateLootQuality = (id: string): string => {
    if (id.includes('POI.Generic')) return 'High';
    if (id.includes('GasStation')) return 'Medium';
    if (id.includes('Landmark')) return 'Medium';
    return 'Low';
  };

  const generatePlayerTraffic = (id: string): string => {
    if (id.includes('POI.Generic')) return 'High';
    if (id.includes('GasStation')) return 'Medium';
    if (id.includes('Landmark')) return 'Low';
    return 'Very Low';
  };

  const generateStrategies = (name: string, id: string) => {
    return {
      drop: `Land on the ${name.toLowerCase()} building for quick loot access.`,
      rotation: `Move towards the center after looting, using natural cover.`,
      endgame: `Use ${name.toLowerCase()} as a strategic position for final circles.`
    };
  };



  const getLootQualityColor = (quality: string) => {
    switch (quality.toLowerCase()) {
      case 'high': return 'text-yellow-400 border-yellow-400';
      case 'medium': return 'text-blue-400 border-blue-400';
      case 'low': return 'text-green-400 border-green-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getPlayerTrafficColor = (traffic: string) => {
    switch (traffic.toLowerCase()) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-orange-400 border-orange-400';
      case 'low': return 'text-green-400 border-green-400';
      case 'very low': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'named location': return 'bg-blue-600';
      case 'landmark': return 'bg-green-600';
      case 'gas station': return 'bg-yellow-600';
      case 'quest location': return 'bg-purple-600';
      default: return 'bg-gray-600';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-green-400';
    if (rating >= 60) return 'text-yellow-400';
    if (rating >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSurvivalRateColor = (rate: number) => {
    if (rate >= 60) return 'text-green-400';
    if (rate >= 45) return 'text-yellow-400';
    if (rate >= 30) return 'text-orange-400';
    return 'text-red-400';
  };

  // Map interaction functions
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 5));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.5));
  };

  // Clean drag functions using the rock-solid pattern
  const applyTransform = () => {
    setMapPosition(prev => prev); // Trigger re-render with current position
  };

  const onPointerDown: React.PointerEventHandler = (e) => {
    if (!isDragEnabled) return;
    isDown.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
    e.currentTarget.classList.add('dragging');
  };

  const onPointerMove: React.PointerEventHandler = (e) => {
    if (!isDown.current || !isDragEnabled) return;

    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;

    setMapPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));

    lastPointer.current = { x: e.clientX, y: e.clientY };

    if (!raf.current) {
      raf.current = requestAnimationFrame(() => {
        applyTransform();
        raf.current = 0;
      });
    }
  };

  const onPointerUp: React.PointerEventHandler = (e) => {
    if (!isDown.current) return;
    isDown.current = false;
    e.currentTarget.classList.remove('dragging');
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
  };

  const resetMapView = () => {
    setZoomLevel(1);
    setMapPosition({ x: 0, y: 0 });
  };

  // Drawing functions
  const handleToolSelect = (tool: string) => {
    setSelectedTool(tool);
  };

  const handleMapClick = (e: React.MouseEvent) => {
    if (!selectedTool) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert click position to map coordinates
    const mapX = (clickX - mapPosition.x) / zoomLevel;
    const mapY = (clickY - mapPosition.y) / zoomLevel;
    
    if (selectedTool === 'marker') {
      addMarker(mapX, mapY);
    } else if (selectedTool === 'text') {
      addText(mapX, mapY);
    } else if (['line', 'area', 'box', 'circle'].includes(selectedTool)) {
      startDrawing(mapX, mapY);
    }
  };

  const startDrawing = (x: number, y: number) => {
    setIsDrawing(true);
    setDrawStart({ x, y });
  };

  const addMarker = (x: number, y: number) => {
    const newMarker = {
      id: Date.now(),
      type: 'marker',
      x: x,
      y: y,
      color: '#FFD700'
    };
    setMapElements(prev => [...prev, newMarker]);
  };

  const addText = (x: number, y: number) => {
    const text = prompt('Enter text:') || 'Text';
    if (text) {
      const newText = {
        id: Date.now(),
        type: 'text',
        x: x,
        y: y,
        text: text,
        color: '#FFFFFF'
      };
      setMapElements(prev => [...prev, newText]);
    }
  };

  const clearMap = () => {
    setMapElements([]);
  };

  const saveMap = () => {
    const mapData = {
      elements: mapElements,
      timestamp: new Date().toISOString()
    };
    const dataStr = JSON.stringify(mapData);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'fortnite-map.json';
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-white text-xl">Loading map data...</div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black">
        <Navbar />
        <div className="pt-24 flex items-center justify-center min-h-screen">
          <div className="text-red-400 text-xl">{error}</div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar />
      
      <div className="pt-24 container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4">🗺️ Fortnite Map & POI Analysis</h1>
          <p className="text-xl text-gray-300 mb-2">Explore POIs and strategic locations</p>
          <p className="text-lg text-gray-400">Chapter 6 Season 4</p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-900 rounded-lg p-1">
            <button
              onClick={() => setViewMode('map')}
              className={`px-6 py-2 rounded-md transition-all duration-300 ${
                viewMode === 'map'
                  ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🗺️ Map View
            </button>
            <button
              onClick={() => setViewMode('poi-analysis')}
              className={`px-6 py-2 rounded-md transition-all duration-300 ${
                viewMode === 'poi-analysis'
                  ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 POI Analysis
            </button>
            <button
              onClick={() => setViewMode('competitive')}
              className={`px-6 py-2 rounded-md transition-all duration-300 ${
                viewMode === 'competitive'
                  ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🏆 Competitive
            </button>
          </div>
        </div>

        {/* Filters and Search */}


        {viewMode === 'map' ? (
          /* Map View */
          <div className="space-y-8">
            {/* Interactive Map */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 shadow-2xl">
              {/* Map Controls */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">🗺️ Fortnite Map</h3>
                <div className="flex items-center gap-3">
                  {/* Zoom Controls */}
                  <div className="flex gap-2">
                    <button 
                      onClick={handleZoomOut}
                      className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                      title="Zoom Out"
                    >
                      🔍-
                    </button>
                    <button 
                      onClick={handleZoomIn}
                      className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                      title="Zoom In"
                    >
                      🔍+
                    </button>
                    <button 
                      onClick={resetMapView}
                      className="px-3 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
                      title="Reset View"
                    >
                      🏠
                    </button>
          </div>
                  
                  {/* Drag Toggle */}
                  <button 
                    onClick={() => setIsDragEnabled(!isDragEnabled)}
                    className={`px-4 py-2 rounded-lg transition-colors border ${
                      isDragEnabled 
                        ? 'bg-gray-700 text-white border-gray-600' 
                        : 'bg-gray-800 text-gray-300 border-gray-700 hover:bg-gray-700'
                    }`}
                    title={isDragEnabled ? 'Disable Dragging' : 'Enable Dragging'}
                  >
                    {isDragEnabled ? '🔒 Locked' : '🖱️ Drag'}
                  </button>
                </div>
        </div>

              <div 
                className="relative w-full h-[600px] bg-gray-800 rounded-xl overflow-hidden border border-gray-700 cursor-grab select-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{
                  touchAction: 'none', // critical for touch panning
                  userSelect: 'none'
                }}
              >
                <div 
                  className="absolute inset-0 transition-transform duration-200"
                  style={{
                    transform: `translate(${mapPosition.x}px, ${mapPosition.y}px) scale(${zoomLevel})`,
                    transformOrigin: 'center'
                  }}
                >
                  {mapData?.images.pois ? (
                    <Image
                      src={mapData.images.pois}
                      alt="Fortnite Map with POIs"
                      width={800}
                      height={600}
                      className="w-full h-full object-contain"
                      draggable={false}
                      onError={(e) => {
                        console.error('Error loading map image');
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-400">
                        <div className="text-8xl mb-4">🗺️</div>
                        <div className="text-2xl">Map Loading...</div>
              </div>
            </div>
                  )}

                  {/* Render drawn elements */}
                  {mapElements.map((element) => (
                    <div
                      key={element.id}
                      className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{
                        left: `${element.x}px`,
                        top: `${element.y}px`
                      }}
                    >
                      {element.type === 'marker' && (
                        <div className="w-4 h-4 bg-yellow-500 border-2 border-yellow-300 rounded-full shadow-lg"></div>
                      )}
                      {element.type === 'text' && (
                        <div className="text-white text-sm font-bold bg-black bg-opacity-50 px-2 py-1 rounded whitespace-nowrap">
                          {element.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 text-center text-sm text-gray-400">
                <p>🔍 Zoom in to explore • 🖱️ Click and drag to pan • Use buttons to zoom</p>
          </div>
        </div>

        {/* POIs Grid */}
            <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">📍</span>
                Points of Interest ({mapData?.pois.length || 0})
              </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mapData?.pois.map((poi) => (
            <div 
              key={poi.id} 
                    className={`bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-700 hover:border-gray-500/50 ${
                      selectedPOI?.id === poi.id ? 'ring-2 ring-gray-500 shadow-gray-500/25' : ''
              }`}
              onClick={() => setSelectedPOI(poi)}
            >
                    {/* POI Header */}
                    <div className="p-5 border-b border-gray-700">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xl font-semibold text-white">{poi.name}</h3>
                        <span className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${getTypeColor(poi.type || '')}`}>
                    {poi.type}
                  </span>
                </div>
                      <p className="text-gray-300 text-sm mb-4 leading-relaxed">{poi.description}</p>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getLootQualityColor(poi.lootQuality || '')} bg-gray-900`}>
                          💎 Loot: {poi.lootQuality}
                        </span>
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getPlayerTrafficColor(poi.playerTraffic || '')} bg-gray-900`}>
                          👥 Traffic: {poi.playerTraffic}
                  </span>
                </div>
              </div>
                    {/* POI Coordinates */}
                    <div className="p-4 bg-gray-700">
                      <div className="text-center">
                        <span className="text-xs text-gray-300 bg-gray-900 px-3 py-2 rounded-lg">
                          📍 X: {poi.location.x.toLocaleString()}, Y: {poi.location.y.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'poi-analysis' ? (
          /* POI Analysis View */
          <div className="space-y-8">
            {/* Play Style Selection */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">🎮 Choose Your Play Style</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setSelectedPlayStyle('aggressive')}
                  className={`p-6 rounded-xl transition-all duration-300 ${
                    selectedPlayStyle === 'aggressive'
                      ? 'bg-red-600 text-white shadow-lg ring-2 ring-red-400'
                      : 'bg-gray-800 text-red-400 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <h4 className="text-xl font-bold mb-2">⚔️ Aggressive</h4>
                  <p className="text-sm">High action, high risk, high reward</p>
                </button>
                
                <button
                  onClick={() => setSelectedPlayStyle('passive')}
                  className={`p-6 rounded-xl transition-all duration-300 ${
                    selectedPlayStyle === 'passive'
                      ? 'bg-green-600 text-white shadow-lg ring-2 ring-green-400'
                      : 'bg-gray-800 text-green-400 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <h4 className="text-xl font-bold mb-2">🛡️ Passive</h4>
                  <p className="text-sm">Safe drops, survival focused, resource gathering</p>
                </button>
                
                <button
                  onClick={() => setSelectedPlayStyle('balanced')}
                  className={`p-6 rounded-xl transition-all duration-300 ${
                    selectedPlayStyle === 'balanced'
                      ? 'bg-gray-700 text-white shadow-lg ring-2 ring-gray-400'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  <h4 className="text-xl font-bold mb-2">⚖️ Balanced</h4>
                  <p className="text-sm">Moderate action, balanced approach</p>
                </button>
                  </div>
            </div>

            {/* Strategy for Selected Play Style */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 text-center">
                🎯 Strategy for {selectedPlayStyle.charAt(0).toUpperCase() + selectedPlayStyle.slice(1)} Players
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recommended Drop Locations */}
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4">📍 Recommended Drop Locations</h4>
                  <div className="space-y-4">
                    {selectedPlayStyle === 'balanced' && (
                      <>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Shiny Shafts</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 109</div>
                            <div><span className="text-gray-300">Metal:</span> 9,300</div>
                            <div><span className="text-gray-300">Zone:</span> 128</div>
                            <div><span className="text-gray-300">75%</span></div>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Kappa Kappa Factory</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 57</div>
                            <div><span className="text-gray-300">Metal:</span> 2,200</div>
                            <div><span className="text-gray-300">Zone:</span> 55</div>
                            <div><span className="text-gray-300">67%</span></div>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Rocky Rus</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 81</div>
                            <div><span className="text-gray-300">Metal:</span> 9,300</div>
                            <div><span className="text-gray-300">Zone:</span> 29</div>
                            <div><span className="text-gray-300">42%</span></div>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedPlayStyle === 'aggressive' && (
                      <>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">First Order Base</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 53</div>
                            <div><span className="text-gray-300">Metal:</span> 10,000</div>
                            <div><span className="text-gray-300">Zone:</span> 45</div>
                            <div><span className="text-gray-300">56%</span></div>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Utopia City</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 53</div>
                            <div><span className="text-gray-300">Metal:</span> 5,300</div>
                            <div><span className="text-gray-300">Zone:</span> 78</div>
                            <div><span className="text-gray-300">54%</span></div>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Kappa Kappa Factory</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 57</div>
                            <div><span className="text-gray-300">Metal:</span> 3,500</div>
                            <div><span className="text-gray-300">Zone:</span> 55</div>
                            <div><span className="text-gray-300">63%</span></div>
                          </div>
                        </div>
                      </>
                    )}
                    {selectedPlayStyle === 'passive' && (
                      <>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Way Station</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 40</div>
                            <div><span className="text-gray-300">Metal:</span> 1,600</div>
                            <div><span className="text-gray-300">Zone:</span> 32</div>
                            <div><span className="text-gray-300">43%</span></div>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Outpost Enclave</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 38</div>
                            <div><span className="text-gray-300">Metal:</span> 2,600</div>
                            <div><span className="text-gray-300">Zone:</span> 28</div>
                            <div><span className="text-gray-300">62%</span></div>
                          </div>
                        </div>
                        <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                          <h5 className="text-lg font-semibold text-white mb-2">Fighting Frogs</h5>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div><span className="text-gray-300">Loot:</span> 49</div>
                            <div><span className="text-gray-300">Metal:</span> 8,300</div>
                            <div><span className="text-gray-300">Zone:</span> 41</div>
                            <div><span className="text-gray-300">70%</span></div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Strategy & Tips */}
                <div>
                  <h4 className="text-xl font-semibold text-white mb-4">💡 Strategy & Tips</h4>
                  <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    {selectedPlayStyle === 'balanced' && (
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li>• Land at balanced locations that offer good loot with moderate competition</li>
                        <li>• Drop at locations with 1.0-1.2 average teams</li>
                        <li>• Balance loot needs with safety</li>
                        <li>• Be ready for fights but don't seek them out</li>
                        <li>• Gather resources while staying alert</li>
                        <li>• Adapt strategy based on early game situation</li>
                      </ul>
                    )}
                    {selectedPlayStyle === 'aggressive' && (
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li>• Land at high-contention POIs for maximum action</li>
                        <li>• Prioritize locations with 1.5+ average teams</li>
                        <li>• Focus on early eliminations and aggressive rotations</li>
                        <li>• Take calculated risks for high-value loot</li>
                        <li>• Push fights and maintain pressure</li>
                        <li>• Use aggressive building and editing techniques</li>
                      </ul>
                    )}
                    {selectedPlayStyle === 'passive' && (
                      <ul className="space-y-2 text-gray-300 text-sm">
                        <li>• Choose isolated locations with minimal competition</li>
                        <li>• Focus on survival and resource gathering</li>
                        <li>• Avoid early fights unless necessary</li>
                        <li>• Prioritize positioning and rotation timing</li>
                        <li>• Gather materials and loot safely</li>
                        <li>• Play for endgame and placement points</li>
                      </ul>
                    )}
                </div>
              </div>
            </div>
            </div>
          </div>
        ) : (
          /* Competitive View */
          <div className="space-y-8">
            {/* Region and Division Selection */}
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 shadow-2xl">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-center">
                {/* Region Selection */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  <button
                    onClick={() => setSelectedRegion('EU')}
                    className={`px-6 py-3 rounded-md transition-all duration-300 font-semibold ${
                      selectedRegion === 'EU'
                        ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🌍 EU
                  </button>
                  <button
                    onClick={() => setSelectedRegion('NAC')}
                    className={`px-6 py-3 rounded-md transition-all duration-300 font-semibold ${
                      selectedRegion === 'NAC'
                        ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    🇺🇸 NAC
                  </button>
        </div>

                {/* Division Selection */}
                <div className="flex bg-gray-800 rounded-lg p-1">
                  {selectedRegion === 'EU' ? (
                    <>
                      <button
                        onClick={() => setSelectedDivision('FNCS Div 1 EU Week 1 Day 1')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'FNCS Div 1 EU Week 1 Day 1'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🏆 Div 1
                      </button>
                      <button
                        onClick={() => setSelectedDivision('FNCS Div 2 EU Week 1 Day 1')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'FNCS Div 2 EU Week 1 Day 1'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🥈 Div 2
                      </button>
                      <button
                        onClick={() => setSelectedDivision('FNCS Div 3 EU Week 1 Day 1')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'FNCS Div 3 EU Week 1 Day 1'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🥉 Div 3
                      </button>
                      <button
                        onClick={() => setSelectedDivision('EU Eval')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'EU Eval'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        📊 Eval
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setSelectedDivision('FNCS Div 1 NAC Week 1 Day 1')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'FNCS Div 1 NAC Week 1 Day 1'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🏆 Div 1
                      </button>
                      <button
                        onClick={() => setSelectedDivision('FNCS Div 2 NAC Week 1 Day 1')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'FNCS Div 2 NAC Week 1 Day 1'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🥈 Div 2
                      </button>
                      <button
                        onClick={() => setSelectedDivision('FNCS Div 3 NAC Week 1 Day 1')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'FNCS Div 3 NAC Week 1 Day 1'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🥉 Div 3
                      </button>
                      <button
                        onClick={() => setSelectedDivision('Trio Loot + Metal Evaluation')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === 'Trio Loot + Metal Evaluation'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🎯 Trio
                      </button>
                      <button
                        onClick={() => setSelectedDivision('🏅 NAC #2 Top 1000 Evaluation')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === '🏅 NAC #2 Top 1000 Evaluation'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🏅 Top 1000
                      </button>
                      <button
                        onClick={() => setSelectedDivision('🌟 NAC #1 Evaluation')}
                        className={`px-4 py-3 rounded-md transition-all duration-300 text-sm ${
                          selectedDivision === '🌟 NAC #1 Evaluation'
                            ? 'bg-gray-700 text-white shadow-lg border border-gray-600'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        🌟 NAC #1
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Display Selected Data */}
            {(() => {
              const currentData = selectedRegion === 'EU' ? euCompetitiveData : competitiveData;
              const selectedData = currentData.find(d => d.region.includes(selectedDivision)) || currentData[0];
              
              if (!selectedData) return <div className="text-center text-gray-400">No data available for selected division</div>;
              
              return (
                <div className="bg-gray-900 rounded-xl p-8 border border-gray-800 shadow-2xl">
                  <h2 className="text-2xl font-bold text-white mb-4">{selectedData.region}</h2>
                  <p className="text-gray-300 mb-6">{selectedData.description}</p>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-700">
                          <th className="text-left py-3 px-4 text-gray-300 font-semibold">🗺️ POI Name</th>
                          <th className="text-center py-3 px-4 text-gray-300 font-semibold">💰 Loot</th>
                          <th className="text-center py-3 px-4 text-gray-300 font-semibold">🔩 Metal</th>
                          <th className="text-center py-3 px-4 text-gray-300 font-semibold">👥 Avg Teams</th>
                          <th className="text-center py-3 px-4 text-gray-300 font-semibold">🛡️ Survival Rate</th>
                          <th className="text-center py-3 px-4 text-gray-300 font-semibold">🌟 Overall Rating</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedData.pois.map((poi, poiIndex) => (
                          <tr key={poiIndex} className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors duration-200">
                            <td className="py-3 px-4 text-white font-medium">{poi.name}</td>
                            <td className="py-3 px-4 text-center text-gray-300">{poi.loot}</td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              {poi.metal === 0 ? '—' : poi.metal.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-center text-gray-300">{poi.avgTeams}</td>
                            <td className="py-3 px-4 text-center text-gray-300">
                              <span className={`font-semibold ${getSurvivalRateColor(poi.survivalRate as number)}`}>
                                {poi.survivalRate === 0 ? '—' : `${poi.survivalRate}%`}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`font-semibold ${getRatingColor(poi.overallRating || 0)}`}>
                                {poi.overallRating}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Selected POI Details Modal */}
        {selectedPOI && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gray-900 backdrop-blur-md rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-3xl font-bold text-white">{selectedPOI.name}</h2>
                  <button
                    onClick={() => setSelectedPOI(null)}
                    className="text-gray-400 hover:text-white text-3xl transition-colors duration-300"
                  >
                    ×
                  </button>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6">
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <span className="mr-2">📍</span>
                      Location Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Type:</span>
                        <span className="text-white font-medium">{selectedPOI.type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">X Coordinate:</span>
                        <span className="text-white font-mono">{selectedPOI.location.x.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Y Coordinate:</span>
                        <span className="text-white font-mono">{selectedPOI.location.y.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Elevation:</span>
                        <span className="text-white font-mono">{selectedPOI.location.z.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <span className="mr-2">📊</span>
                      Strategic Info
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Loot Quality:</span>
                        <span className={`font-semibold ${getLootQualityColor(selectedPOI.lootQuality || '')}`}>
                          {selectedPOI.lootQuality}
                        </span>
                        </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Player Traffic:</span>
                        <span className={`font-semibold ${getPlayerTrafficColor(selectedPOI.playerTraffic || '')}`}>
                          {selectedPOI.playerTraffic}
                        </span>
                      </div>
                        </div>
                      </div>
                    </div>

                <div className="mb-6">
                  <h3 className="text-xl font-semibold text-white mb-3 flex items-center">
                    <span className="mr-2">📝</span>
                    Description
                  </h3>
                  <p className="text-gray-300 text-lg leading-relaxed bg-gray-800 rounded-xl p-4 border border-gray-700">
                    {selectedPOI.description}
                  </p>
                  </div>

                {selectedPOI.strategies && (
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
                      <span className="mr-2">🎯</span>
                      Strategic Recommendations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center">
                          <span className="mr-1">🪂</span>
                          Drop Strategy
                        </h4>
                        <p className="text-white text-sm leading-relaxed">{selectedPOI.strategies.drop}</p>
                </div>
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center">
                          <span className="mr-1">🔄</span>
                          Rotation
                        </h4>
                        <p className="text-white text-sm leading-relaxed">{selectedPOI.strategies.rotation}</p>
                      </div>
                      <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                        <h4 className="text-sm font-semibold text-gray-400 mb-2 flex items-center">
                          <span className="mr-1">🏆</span>
                          Endgame
                        </h4>
                        <p className="text-white text-sm leading-relaxed">{selectedPOI.strategies.endgame}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
