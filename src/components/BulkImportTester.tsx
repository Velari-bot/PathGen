'use client';
import React, { useState } from 'react';

export default function BulkImportTester() {
  const [testFiles, setTestFiles] = useState<File[]>([]);

  const createTestFiles = () => {
    const files: File[] = [];
    
    // Create a test zone guide file
    const zoneContent = `Zone Management Guide

# Tilted Towers Strategy
Tilted Towers is a high-risk, high-reward landing spot. 
- Land on the tallest building for best loot
- Use building to gain height advantage
- Rotate early to avoid getting pinched

# Retail Row Rotation
After looting Retail Row:
- Head north to avoid storm
- Use the river for cover
- Build bridges when crossing open areas`;

    const zoneFile = new File([zoneContent], 'zone_guide.txt', { type: 'text/plain' });
    files.push(zoneFile);

    // Create a test mechanics file
    const mechanicsContent = `Building Mechanics

# Quick Building
- Press Q to place walls instantly
- Use turbo building for rapid construction
- Edit walls to create windows and doors

# Combat Building
- Build walls while reloading
- Use ramps for height advantage
- Edit structures to surprise enemies`;

    const mechanicsFile = new File([mechanicsContent], 'building_mechanics.txt', { type: 'text/plain' });
    files.push(mechanicsFile);

    // Create a test strategy file
    const strategyContent = `Advanced Strategies

# Box Fighting
- Build a 1x1 box when under pressure
- Edit walls to create escape routes
- Use cones for additional protection

# Team Tactics
- Coordinate building with teammates
- Share resources and materials
- Use voice chat for callouts`;

    const strategyFile = new File([strategyContent], 'advanced_strategies.txt', { type: 'text/plain' });
    files.push(strategyFile);

    setTestFiles(files);
  };

  const downloadTestFiles = () => {
    testFiles.forEach((file, index) => {
      const url = URL.createObjectURL(file);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
      <h3 className="text-xl font-semibold text-white mb-4">Test File Generator</h3>
      <p className="text-gray-300 mb-4">
        Generate sample documentation files to test the bulk import system.
      </p>
      
      <div className="flex gap-4">
        <button
          onClick={createTestFiles}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        >
          Generate Test Files
        </button>
        
        {testFiles.length > 0 && (
          <button
            onClick={downloadTestFiles}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
          >
            Download {testFiles.length} Test Files
          </button>
        )}
      </div>

      {testFiles.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-300 mb-2">Generated test files:</p>
          <ul className="text-xs text-gray-400 space-y-1">
            {testFiles.map((file, index) => (
              <li key={index}>• {file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
            ))}
          </ul>
          <p className="text-xs text-gray-500 mt-2">
            Download these files and then use the bulk import above to test the system.
          </p>
        </div>
      )}
    </div>
  );
}
