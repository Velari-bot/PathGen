'use client';

import React, { useState, useEffect } from 'react';

interface TrackingLink {
  id: string;
  name: string;
  code: string;
  url: string;
  isActive: boolean;
  totalClicks: number;
  totalSignups: number;
  totalPaidSubscriptions: number;
  totalRevenue: number;
  conversionRate: number;
  paidConversionRate: number;
  averageRevenuePerUser: number;
  createdAt: Date;
}

export default function TrackingDashboard() {
  const [links, setLinks] = useState<TrackingLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newLink, setNewLink] = useState({ name: '', code: '' });

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    try {
      const response = await fetch('/api/admin/tracking-links');
      const data = await response.json();
      
      if (data.success) {
        setLinks(data.links);
      }
    } catch (error) {
      console.error('Failed to load links:', error);
    } finally {
      setLoading(false);
    }
  };

  const createLink = async () => {
    if (!newLink.name || !newLink.code) {
      alert('Please fill in both name and code');
      return;
    }

    setCreating(true);
    try {
      const response = await fetch('/api/admin/tracking-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLink)
      });

      const data = await response.json();
      
      if (data.success) {
        setNewLink({ name: '', code: '' });
        await loadLinks(); // Refresh the list
        alert(`Link created! URL: ${data.link.url}`);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to create link:', error);
      alert('Failed to create link');
    } finally {
      setCreating(false);
    }
  };

  const toggleLinkStatus = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/tracking-links', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !currentStatus })
      });

      if (response.ok) {
        await loadLinks(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to toggle link status:', error);
    }
  };

  const deleteLink = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?\n\nThis will permanently delete:\n- The tracking link\n- All click/signup/payment data\n- All associated events\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/tracking-links', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      const result = await response.json();
      
      if (response.ok) {
        alert(`✅ ${result.message}`);
        await loadLinks(); // Refresh the list
      } else {
        alert(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to delete link:', error);
      alert('Failed to delete link');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
        <div className="text-center text-gray-900">Loading tracking dashboard...</div>
      </div>
    );
  }

  const totalStats = links.reduce((acc, link) => ({
    clicks: acc.clicks + link.totalClicks,
    signups: acc.signups + link.totalSignups,
    paidSubs: acc.paidSubs + link.totalPaidSubscriptions,
    revenue: acc.revenue + link.totalRevenue
  }), { clicks: 0, signups: 0, paidSubs: 0, revenue: 0 });

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">📊 Link Tracking Dashboard</h1>
        <p className="text-gray-700">Monitor your marketing campaigns and track conversions</p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">{totalStats.clicks}</div>
          <div className="text-sm text-blue-800">Total Clicks</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{totalStats.signups}</div>
          <div className="text-sm text-green-800">Total Signups</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">{totalStats.paidSubs}</div>
          <div className="text-sm text-purple-800">Paid Subscriptions</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">
            ${(totalStats.revenue / 100).toFixed(2)}
          </div>
          <div className="text-sm text-yellow-800">Total Revenue</div>
        </div>
      </div>

      {/* Create New Link */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">📝 Create New Tracking Link</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Campaign Name</label>
            <input
              type="text"
              placeholder="e.g., YouTube Campaign"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={newLink.name}
              onChange={(e) => setNewLink({ ...newLink, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Tracking Code</label>
            <input
              type="text"
              placeholder="e.g., YOUTUBE"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              value={newLink.code}
              onChange={(e) => setNewLink({ ...newLink, code: e.target.value.toUpperCase() })}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={createLink}
              disabled={creating}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Link'}
            </button>
          </div>
        </div>
        <div className="mt-3 text-sm text-gray-600">
          Generated URL will be: https://pathgen.online?track={newLink.code || 'CODE'}
        </div>
      </div>

      {/* Links Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">🔗 Your Tracking Links</h2>
        </div>
        
        {links.length === 0 ? (
          <div className="p-8 text-center text-gray-600">
            No tracking links created yet. Create your first link above!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Campaign</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Link</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Clicks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Signups</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Subs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Revenue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conv. Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {links.map((link) => (
                  <tr key={link.id} className={!link.isActive ? 'bg-gray-50 opacity-60' : ''}>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{link.name}</div>
                      <div className="text-sm text-gray-600">
                        Code: {link.code}
                        {!link.isActive && ' (Inactive)'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">
                          {link.url.replace('https://pathgen.online', '')}
                        </code>
                        <button
                          onClick={() => copyToClipboard(link.url)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                          title="Copy full URL"
                        >
                          📋
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{link.totalClicks}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{link.totalSignups}</div>
                      {link.totalClicks > 0 && (
                        <div className="text-xs text-gray-500">
                          {((link.totalSignups / link.totalClicks) * 100).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-green-600">{link.totalPaidSubscriptions}</div>
                      {link.totalClicks > 0 && (
                        <div className="text-xs text-gray-500">
                          {((link.totalPaidSubscriptions / link.totalClicks) * 100).toFixed(1)}%
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-green-600">
                        ${(link.totalRevenue / 100).toFixed(2)}
                      </div>
                      {link.totalPaidSubscriptions > 0 && (
                        <div className="text-xs text-gray-500">
                          ${(link.averageRevenuePerUser / 100).toFixed(2)} avg
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div>Signup: {link.conversionRate.toFixed(1)}%</div>
                        <div>Paid: {link.paidConversionRate.toFixed(1)}%</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleLinkStatus(link.id, link.isActive)}
                          className={`text-sm px-3 py-1 rounded ${
                            link.isActive 
                              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {link.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteLink(link.id, link.name)}
                          className="text-sm px-3 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
                          title="Delete link and all data"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Tracking */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">🔧 Manual Purchase Tracking</h3>
        <p className="text-sm text-gray-800 mb-4">If a purchase wasn't automatically tracked, you can manually add it here:</p>
        
        <div className="flex space-x-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Tracking Code</label>
            <input
              type="text"
              placeholder="e.g., VOID"
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              id="manual-tracking-code"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">Amount (cents)</label>
            <input
              type="number"
              placeholder="2900"
              defaultValue="2900"
              className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white"
              id="manual-amount"
            />
          </div>
          <button
            onClick={async () => {
              const code = (document.getElementById('manual-tracking-code') as HTMLInputElement)?.value;
              const amount = parseInt((document.getElementById('manual-amount') as HTMLInputElement)?.value || '2900');
              
              if (!code) {
                alert('Please enter a tracking code');
                return;
              }
              
              try {
                const response = await fetch('/api/manual-track-purchase', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ trackingCode: code, amount })
                });
                
                const result = await response.json();
                
                if (result.success) {
                  alert(`✅ Purchase tracked! ${code} now has ${result.stats.totalPaidSubscriptions} paid subscriptions`);
                  await loadLinks(); // Refresh the dashboard
                } else {
                  alert(`❌ Error: ${result.error}`);
                }
              } catch (error) {
                alert('Failed to track purchase');
              }
            }}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
          >
            Track Purchase
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-gray-900">📋 How to Use Your Tracking Links</h3>
        <div className="space-y-2 text-sm text-gray-800">
          <p><strong>1. Share your links:</strong> Copy any tracking URL and share it on social media, YouTube, Discord, etc.</p>
          <p><strong>2. Track clicks:</strong> When someone clicks your link, we automatically track it</p>
          <p><strong>3. Monitor signups:</strong> When tracked visitors create accounts, we count them as signups</p>
          <p><strong>4. Track revenue:</strong> When they buy Pro subscriptions, we track the revenue from your link</p>
        </div>
        <div className="mt-4 p-3 bg-blue-100 rounded">
          <strong className="text-gray-900">Example:</strong> <span className="text-gray-800">Share "https://pathgen.online?track=YOUTUBE" in your video description to track YouTube conversions!</span>
        </div>
      </div>
    </div>
  );
}
