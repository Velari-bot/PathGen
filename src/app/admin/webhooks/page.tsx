'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';

interface WebhookLog {
  id: string;
  eventType: string;
  subscriptionId?: string;
  userId?: string;
  plan?: string;
  status?: string;
  success: boolean;
  error?: string;
  timestamp: string;
  manual?: boolean;
}

interface WebhookStats {
  total: number;
  successful: number;
  failed: number;
  byEventType: Record<string, number>;
  recentFailures: Array<{
    eventType: string;
    error: string;
    timestamp: string;
  }>;
}

export default function WebhookStatusPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [stats, setStats] = useState<WebhookStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    eventType: '',
    success: '',
    limit: '50'
  });

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.eventType) params.append('eventType', filters.eventType);
      if (filters.success) params.append('success', filters.success);
      params.append('limit', filters.limit);

      const response = await fetch(`/api/webhooks/debug?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setLogs(data.logs);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching webhook logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const retrySubscriptionUpdate = async (subscriptionId: string, userId: string) => {
    setRetrying(subscriptionId);
    try {
      const response = await fetch('/api/webhooks/debug', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'retry_subscription_update',
          subscriptionId,
          userId
        })
      });
      
      const data = await response.json();
      if (data.success) {
        alert(`Successfully updated subscription ${subscriptionId} for user ${userId}`);
        fetchLogs(); // Refresh logs
      } else {
        alert(`Failed to retry: ${data.error}`);
      }
    } catch (error) {
      console.error('Error retrying subscription update:', error);
      alert('Failed to retry subscription update');
    } finally {
      setRetrying(null);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filters]);

  const getStatusColor = (success: boolean) => {
    return success ? 'text-green-400' : 'text-red-400';
  };

  const getStatusIcon = (success: boolean) => {
    return success ? '✅' : '❌';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-dark">
      <Navbar />
      
      <div className="pt-20 pb-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              🔧 Webhook Status Monitor
            </h1>
            <p className="text-gray-300">
              Monitor Stripe webhook events and debug subscription issues
            </p>
          </div>

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{stats.total}</div>
                <div className="text-gray-400">Total Events</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">{stats.successful}</div>
                <div className="text-gray-400">Successful</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-red-400 mb-2">{stats.failed}</div>
                <div className="text-gray-400">Failed</div>
              </div>
              <div className="glass-card p-6 text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  {stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}%
                </div>
                <div className="text-gray-400">Success Rate</div>
              </div>
            </div>
          )}

          {/* Event Type Breakdown */}
          {stats && (
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Event Type Breakdown</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(stats.byEventType).map(([eventType, count]) => (
                  <div key={eventType} className="text-center">
                    <div className="text-2xl font-bold text-white">{count}</div>
                    <div className="text-gray-400 text-sm">{eventType}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Failures */}
          {stats && stats.recentFailures.length > 0 && (
            <div className="glass-card p-6 mb-8">
              <h3 className="text-xl font-semibold text-white mb-4">Recent Failures</h3>
              <div className="space-y-3">
                {stats.recentFailures.map((failure, index) => (
                  <div key={index} className="bg-red-900 bg-opacity-30 border border-red-600 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-red-400 font-medium">{failure.eventType}</div>
                        <div className="text-gray-300 text-sm">{failure.error}</div>
                      </div>
                      <div className="text-gray-400 text-sm">
                        {formatTimestamp(failure.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="glass-card p-6 mb-8">
            <h3 className="text-xl font-semibold text-white mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-white font-medium mb-2">Event Type</label>
                <select
                  value={filters.eventType}
                  onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All Events</option>
                  <option value="customer.subscription.created">Subscription Created</option>
                  <option value="customer.subscription.updated">Subscription Updated</option>
                  <option value="customer.subscription.deleted">Subscription Deleted</option>
                  <option value="invoice.payment_succeeded">Payment Succeeded</option>
                  <option value="invoice.payment_failed">Payment Failed</option>
                  <option value="checkout.session.completed">Checkout Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Status</label>
                <select
                  value={filters.success}
                  onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="">All</option>
                  <option value="true">Successful</option>
                  <option value="false">Failed</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-medium mb-2">Limit</label>
                <select
                  value={filters.limit}
                  onChange={(e) => setFilters({ ...filters, limit: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white"
                >
                  <option value="25">25</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                  <option value="200">200</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchLogs}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Webhook Logs */}
          <div className="glass-card p-6">
            <h3 className="text-xl font-semibold text-white mb-4">Webhook Logs</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="text-gray-400">Loading webhook logs...</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left text-gray-400 py-3">Status</th>
                      <th className="text-left text-gray-400 py-3">Event Type</th>
                      <th className="text-left text-gray-400 py-3">User ID</th>
                      <th className="text-left text-gray-400 py-3">Plan</th>
                      <th className="text-left text-gray-400 py-3">Timestamp</th>
                      <th className="text-left text-gray-400 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-gray-800">
                        <td className="py-3">
                          <span className={`${getStatusColor(log.success)} flex items-center`}>
                            {getStatusIcon(log.success)}
                          </span>
                        </td>
                        <td className="py-3 text-white">{log.eventType}</td>
                        <td className="py-3 text-gray-300 font-mono text-xs">
                          {log.userId || 'N/A'}
                        </td>
                        <td className="py-3 text-gray-300">{log.plan || 'N/A'}</td>
                        <td className="py-3 text-gray-400 text-xs">
                          {formatTimestamp(log.timestamp)}
                        </td>
                        <td className="py-3">
                          {!log.success && log.subscriptionId && log.userId && (
                            <button
                              onClick={() => retrySubscriptionUpdate(log.subscriptionId!, log.userId!)}
                              disabled={retrying === log.subscriptionId}
                              className="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-600 text-white text-xs rounded transition-colors"
                            >
                              {retrying === log.subscriptionId ? 'Retrying...' : 'Retry'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    No webhook logs found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
