import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api, { metricsHistoryAPI } from '../services/api';
import { History, Calendar, User, TrendingUp, TrendingDown, Minus, Trash2, AlertTriangle } from 'lucide-react';

const MetricsHistory = () => {
  const { pnlId, subPnlId } = useParams();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        let response;
        
        if (subPnlId) {
          response = await api.get(`/sub-pnls/${subPnlId}/metrics-history`);
        } else if (pnlId) {
          response = await api.get(`/pnls/${pnlId}/metrics-history`);
        } else {
          response = await api.get('/metrics-history');
        }
        
        setHistory(response.data);
      } catch (err) {
        setError('Failed to fetch metrics history');
        console.error('Error fetching metrics history:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [pnlId, subPnlId]);

  const handleDeleteHistory = async (historyId) => {
    try {
      setDeletingId(historyId);
      await metricsHistoryAPI.delete(historyId);
      
      // Remove the deleted item from the local state
      setHistory(prevHistory => prevHistory.filter(item => item.id !== historyId));
      setDeleteConfirmId(null);
      
      // Show success message (optional)
      alert('History entry deleted successfully');
    } catch (err) {
      console.error('Error deleting history:', err);
      alert('Failed to delete history entry. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatMetricsData = (jsonString) => {
    try {
      const data = JSON.parse(jsonString);
      return Object.entries(data).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</span> {value}
        </div>
      ));
    } catch {
      return <div className="text-xs text-gray-500">Invalid data format</div>;
    }
  };

  const getChangeTypeIcon = (changeType) => {
    switch (changeType) {
      case 'create':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'update':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <Minus className="h-4 w-4 text-red-500" />;
      default:
        return <History className="h-4 w-4 text-gray-500" />;
    }
  };

  const getChangeTypeColor = (changeType) => {
    switch (changeType) {
      case 'create':
        return 'bg-green-100 text-green-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      case 'delete':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <History className="h-6 w-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Metrics History</h1>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12">
          <History className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No history found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No metrics changes have been recorded yet.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {history.map((item) => (
              <li key={item.id} className="px-6 py-4">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {getChangeTypeIcon(item.change_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChangeTypeColor(
                            item.change_type
                          )}`}
                        >
                          {item.change_type.toUpperCase()}
                        </span>
                        <span className="text-sm font-medium text-gray-900">
                          {item.entity_type.toUpperCase()} #{item.entity_id}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(item.created_at)}</span>
                        </div>
                        
                        {/* Delete button */}
                        {deleteConfirmId === item.id ? (
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleDeleteHistory(item.id)}
                              disabled={deletingId === item.id}
                              className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                            >
                              {deletingId === item.id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-700"></div>
                              ) : (
                                <>
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Confirm
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              disabled={deletingId === item.id}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(item.id)}
                            className="inline-flex items-center p-1 border border-transparent rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            title="Delete history entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {item.change_description && (
                      <p className="mt-1 text-sm text-gray-600">{item.change_description}</p>
                    )}
                    
                    {item.user && (
                      <div className="mt-2 flex items-center space-x-1 text-xs text-gray-500">
                        <User className="h-3 w-3" />
                        <span>Changed by: {item.user.email}</span>
                      </div>
                    )}
                    
                    <div className="mt-3">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Metrics Data:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {formatMetricsData(item.metrics_data)}
                        </div>
                      </div>
                      
                      {item.previous_values && (
                        <div className="mt-2 bg-yellow-50 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Previous Values:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {formatMetricsData(item.previous_values)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default MetricsHistory;