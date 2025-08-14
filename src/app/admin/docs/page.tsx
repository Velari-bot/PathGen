'use client';
import React, { useState, useEffect } from 'react';
import { 
  getFullDocumentation, 
  getDocumentationSection,
  zoneGuides,
  mechanics,
  strategies,
  metaAnalysis,
  tipsAndTricks
} from '@/lib/ai-docs';
import BulkImportTester from '@/components/BulkImportTester';

export default function DocsAdminPage() {
  const [activeSection, setActiveSection] = useState<'zoneGuides' | 'mechanics' | 'strategies' | 'metaAnalysis' | 'tipsAndTricks'>('zoneGuides');
  const [editedContent, setEditedContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [bulkImportFiles, setBulkImportFiles] = useState<File[]>([]);
  const [importProgress, setImportProgress] = useState<string>('');
  const [autoCategorization, setAutoCategorization] = useState(true);

  useEffect(() => {
    loadSectionContent(activeSection);
  }, [activeSection]);

  const loadSectionContent = (section: string) => {
    const content = getDocumentationSection(section as any);
    setEditedContent(content);
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      // In a real app, you'd save this to a database or file system
      // For now, we'll just show a success message
      setSaveStatus('Documentation updated successfully! (Note: This is a demo - changes are not persisted)');
      setIsEditing(false);
      
      setTimeout(() => setSaveStatus(''), 3000);
    } catch (error) {
      setSaveStatus('Error saving documentation');
    }
  };

  const handleReset = () => {
    loadSectionContent(activeSection);
    setSaveStatus('');
  };

  const handleBulkFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setBulkImportFiles(files);
  };

  const processBulkImport = async () => {
    if (bulkImportFiles.length === 0) return;

    setImportProgress('Processing files...');
    const processedContent: { [key: string]: string[] } = {
      zoneGuides: [],
      mechanics: [],
      strategies: [],
      metaAnalysis: [],
      tipsAndTricks: []
    };

    try {
      for (let i = 0; i < bulkImportFiles.length; i++) {
        const file = bulkImportFiles[i];
        setImportProgress(`Processing ${file.name} (${i + 1}/${bulkImportFiles.length})...`);

        let content = '';
        
        if (file.type === 'application/pdf') {
          try {
            setImportProgress(`Parsing PDF: ${file.name}...`);
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await import('pdf-parse');
            const data = await pdf.default(Buffer.from(arrayBuffer));
            content = data.text;
          } catch (pdfError) {
            console.error('PDF parsing error:', pdfError);
            content = `[Error parsing PDF ${file.name}: ${pdfError}]`;
          }
        } else {
          // For text files
          content = await file.text();
        }

        // Auto-categorize content based on keywords
        if (autoCategorization) {
          const categorized = categorizeContent(content, file.name);
          Object.keys(categorized).forEach(section => {
            if (categorized[section]) {
              processedContent[section].push(categorized[section]);
            }
          });
        } else {
          // Manual categorization - add to current active section
          processedContent[activeSection].push(content);
        }
      }

      // Update the edited content with the processed content
      const combinedContent = Object.keys(processedContent)
        .filter(section => processedContent[section].length > 0)
        .map(section => {
          const sectionTitle = getSectionTitle(section);
          return `# ${sectionTitle}\n\n${processedContent[section].join('\n\n---\n\n')}`;
        })
        .join('\n\n');

      setEditedContent(combinedContent);
      setIsEditing(true);
      setImportProgress(`Import complete! Processed ${bulkImportFiles.length} files.`);
      setBulkImportFiles([]);
      
      setTimeout(() => setImportProgress(''), 5000);
    } catch (error) {
      setImportProgress(`Error processing files: ${error}`);
      setTimeout(() => setImportProgress(''), 5000);
    }
  };

  const categorizeContent = (content: string, filename: string): { [key: string]: string } => {
    const lowerContent = content.toLowerCase();
    const lowerFilename = filename.toLowerCase();
    
    // Define keywords for each category
    const keywords = {
      zoneGuides: ['zone', 'map', 'location', 'drop', 'landing', 'rotation', 'position', 'area', 'region'],
      mechanics: ['build', 'edit', 'shoot', 'aim', 'movement', 'inventory', 'shield', 'health', 'material'],
      strategies: ['strategy', 'tactic', 'approach', 'method', 'technique', 'playstyle', 'engagement'],
      metaAnalysis: ['meta', 'weapon', 'item', 'balance', 'patch', 'update', 'current', 'season'],
      tipsAndTricks: ['tip', 'trick', 'advice', 'help', 'improve', 'better', 'pro', 'expert']
    };

    // Score each category based on keyword matches
    const scores: { [key: string]: number } = {};
    Object.keys(keywords).forEach(section => {
      scores[section] = keywords[section as keyof typeof keywords].reduce((score, keyword) => {
        const matches = (lowerContent.match(new RegExp(keyword, 'g')) || []).length;
        const filenameMatches = lowerFilename.includes(keyword) ? 3 : 0; // Filename matches get bonus points
        return score + matches + filenameMatches;
      }, 0);
    });

    // Find the category with the highest score
    const bestCategory = Object.keys(scores).reduce((a, b) => scores[a] > scores[b] ? a : b);
    
    // Only categorize if we have a reasonable confidence (score > 0)
    if (scores[bestCategory] > 0) {
      return { [bestCategory]: content };
    }
    
    // Default to tips if no clear category
    return { tipsAndTricks: content };
  };

  const getSectionTitle = (section: string) => {
    const titles = {
      zoneGuides: 'Zone Management Guide',
      mechanics: 'Core Game Mechanics',
      strategies: 'Advanced Strategies',
      metaAnalysis: 'Meta Analysis',
      tipsAndTricks: 'Pro Tips & Tricks'
    };
    return titles[section as keyof typeof titles] || section;
  };

  const getSectionDescription = (section: string) => {
    const descriptions = {
      zoneGuides: 'Map knowledge, rotation strategies, and zone positioning',
      mechanics: 'Building, combat, movement, and inventory management',
      strategies: 'Advanced fighting techniques, box fighting, and team strategies',
      metaAnalysis: 'Current weapon meta, item priorities, and playstyle adaptation',
      tipsAndTricks: 'General gameplay advice, building tips, and mental game'
    };
    return descriptions[section as keyof typeof descriptions] || '';
  };

  return (
    <div className="min-h-screen bg-gradient-dark p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">AI Documentation Management</h1>
          <p className="text-gray-300 text-lg">
            Manage the core Fortnite knowledge that gets automatically included in every AI response.
            Users can still add their own personal strategies, but this documentation provides the foundation.
          </p>
        </div>

        {/* Test File Generator */}
        <BulkImportTester />

        {/* Bulk Import Section */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Bulk Documentation Import</h2>
          <p className="text-gray-300 mb-4">
            Upload multiple PDF or TXT files at once. The system will automatically categorize them based on content,
            or you can manually assign them to specific sections.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* File Upload */}
            <div>
              <label className="block text-white font-medium mb-2">Select Files</label>
              <input
                type="file"
                multiple
                accept=".pdf,.txt,.md"
                onChange={handleBulkFileUpload}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600"
              />
              {bulkImportFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-300">Selected files:</p>
                  <ul className="text-xs text-gray-400 mt-1">
                    {bulkImportFiles.map((file, index) => (
                      <li key={index}>• {file.name} ({(file.size / 1024).toFixed(1)} KB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Import Options */}
            <div>
              <label className="block text-white font-medium mb-2">Import Options</label>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={autoCategorization}
                    onChange={(e) => setAutoCategorization(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-gray-300 text-sm">Auto-categorize content based on keywords</span>
                </label>
                
                {!autoCategorization && (
                  <div className="text-xs text-gray-400">
                    Files will be imported into the currently selected section: <strong>{getSectionTitle(activeSection)}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Import Progress */}
          {importProgress && (
            <div className="mt-4 p-3 bg-blue-500/20 border border-blue-500/30 rounded-lg">
              <p className="text-blue-300 text-sm">{importProgress}</p>
            </div>
          )}

          {/* Import Button */}
          <div className="mt-4">
            <button
              onClick={processBulkImport}
              disabled={bulkImportFiles.length === 0}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
            >
              Import {bulkImportFiles.length > 0 ? `${bulkImportFiles.length} File${bulkImportFiles.length > 1 ? 's' : ''}` : 'Files'}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['zoneGuides', 'mechanics', 'strategies', 'metaAnalysis', 'tipsAndTricks'] as const).map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeSection === section
                  ? 'bg-blue-500 text-white'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              }`}
            >
              {getSectionTitle(section)}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
          {/* Section Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-2">
              {getSectionTitle(activeSection)}
            </h2>
            <p className="text-gray-400">
              {getSectionDescription(activeSection)}
            </p>
          </div>

          {/* Edit Controls */}
          <div className="flex gap-3 mb-4">
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
              >
                Edit Documentation
              </button>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </>
            )}
          </div>

          {/* Save Status */}
          {saveStatus && (
            <div className={`p-3 rounded-lg mb-4 ${
              saveStatus.includes('Error') 
                ? 'bg-red-500/20 border border-red-500/30 text-red-400' 
                : 'bg-green-500/20 border border-green-500/30 text-green-400'
            }`}>
              {saveStatus}
            </div>
          )}

          {/* Content Editor/Viewer */}
          <div className="bg-black/20 rounded-lg p-4">
            {isEditing ? (
              <textarea
                value={editedContent}
                onChange={(e) => setEditedContent(e.target.value)}
                className="w-full h-96 bg-white/10 border border-white/20 rounded-lg p-4 text-white font-mono text-sm resize-none"
                placeholder="Enter your documentation content here..."
              />
            ) : (
              <div className="prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap text-white font-mono text-sm leading-relaxed">
                  {editedContent}
                </pre>
              </div>
            )}
          </div>

          {/* Character Count */}
          <div className="mt-4 text-right">
            <span className="text-gray-400 text-sm">
              {editedContent.length} characters
            </span>
          </div>
        </div>

        {/* Documentation Preview */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Documentation Preview</h3>
          <div className="bg-black/20 rounded-lg p-4 max-h-64 overflow-y-auto">
            <div className="prose prose-invert max-w-none">
              <pre className="whitespace-pre-wrap text-white font-mono text-xs leading-relaxed">
                {getFullDocumentation()}
              </pre>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            This is what gets automatically included in every AI response, combined with user's personal customizations.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-6">
          <h3 className="text-xl font-semibold text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
              <h4 className="text-blue-300 font-semibold mb-2">Export Documentation</h4>
              <p className="text-blue-200 text-sm mb-3">
                Download the current documentation as a markdown file for backup or editing.
              </p>
              <button className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors">
                Export as .md
              </button>
            </div>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
              <h4 className="text-green-300 font-semibold mb-2">Import Documentation</h4>
              <p className="text-green-200 text-sm mb-3">
                Import documentation from external files to update the AI knowledge base.
              </p>
              <button className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-sm rounded transition-colors">
                Import File
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
