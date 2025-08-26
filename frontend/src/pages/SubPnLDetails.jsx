import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subPnlAPI } from '../services/api';
import api from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { 
  Package, 
  ChevronRight, 
  ChevronLeft, 
  Edit, 
  Save, 
  X, 
  TestTube, 
  Bug, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  FileText,
  History,
  Calendar,
  User,
  Tag
} from 'lucide-react';

const SubPnLDetails = () => {
  const { subPnlId } = useParams();
  const navigate = useNavigate();
  const [subPnl, setSubPnl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editingMetrics, setEditingMetrics] = useState({});
  const [saving, setSaving] = useState(false);
  const [metricsHistory, setMetricsHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (subPnlId) {
      fetchSubPnLDetails();
      fetchMetricsHistory();
    }
  }, [subPnlId]);

  const fetchSubPnLDetails = async () => {
    try {
      setLoading(true);
      const response = await subPnlAPI.getById(subPnlId);
      setSubPnl(response.data);
      if (response.data.detail_metrics) {
        setEditingMetrics(response.data.detail_metrics);
      }
    } catch (err) {
      setError('Failed to fetch Sub-PnL details');
      console.error('Sub-PnL details error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMetricsHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await api.get(`/sub-pnls/${subPnlId}/metrics-history`);
      setMetricsHistory(response.data);
    } catch (err) {
      console.error('Failed to fetch metrics history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    if (subPnl?.detail_metrics) {
      setEditingMetrics(subPnl.detail_metrics);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await subPnlAPI.updateDetailMetrics(subPnlId, editingMetrics);
      setEditing(false);
      await fetchSubPnLDetails(); // Refresh data
      await fetchMetricsHistory(); // Refresh history after save
    } catch (err) {
      console.error('Failed to save metrics:', err);
      alert('Failed to save metrics. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleMetricChange = (field, value) => {
    setEditingMetrics(prev => ({
      ...prev,
      [field]: value
    }));
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

  const formatMetricName = (key) => {
    return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const parseMetricsData = (jsonString) => {
    try {
      return JSON.parse(jsonString);
    } catch {
      return {};
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error}</p>
        <div className="mt-4 flex space-x-2">
          <Button onClick={fetchSubPnLDetails}>Retry</Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const metrics = subPnl?.detail_metrics || {};

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button 
          onClick={() => navigate('/dashboard')}
          className="hover:text-blue-600"
        >
          Dashboard
        </button>
        <ChevronRight className="h-4 w-4" />
        <button 
          onClick={() => navigate(`/sub-pnls/${subPnl?.main_pnl_id}`)}
          className="hover:text-blue-600"
        >
          Sub-PnLs
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">{subPnl?.name}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate(`/sub-pnls/${subPnl?.main_pnl_id}`)}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Sub-PnLs</span>
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Package className="h-8 w-8 text-green-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{subPnl?.name}</h1>
              <p className="text-gray-600">{subPnl?.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline"
            onClick={() => navigate(`/sub-pnls/${subPnlId}/metrics-history`)}
            className="flex items-center space-x-2"
          >
            <History className="h-4 w-4" />
            <span>Metrics History</span>
          </Button>
          {!editing ? (
            <Button onClick={handleEdit} className="flex items-center space-x-2">
              <Edit className="h-4 w-4" />
              <span>Edit Metrics</span>
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button 
                onClick={handleSave} 
                disabled={saving}
                className="flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save'}</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                className="flex items-center space-x-2"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Features Shipped */}
        <Card className="p-6 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2 mb-3">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Features Shipped</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              value={editingMetrics.features_shipped || 0}
              onChange={(e) => handleMetricChange('features_shipped', parseInt(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-blue-700">{metrics.features_shipped || 0}</p>
          )}
        </Card>

        {/* Total Testcases Executed */}
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center space-x-2 mb-3">
            <TestTube className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Total Testcases Executed</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              value={editingMetrics.total_testcases_executed || 0}
              onChange={(e) => handleMetricChange('total_testcases_executed', parseInt(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-green-700">{metrics.total_testcases_executed || 0}</p>
          )}
        </Card>

        {/* Total Bugs Logged */}
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex items-center space-x-2 mb-3">
            <Bug className="h-5 w-5 text-yellow-600" />
            <h3 className="font-semibold text-yellow-900">Total Bugs Logged</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              value={editingMetrics.total_bugs_logged || 0}
              onChange={(e) => handleMetricChange('total_bugs_logged', parseInt(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-yellow-700">{metrics.total_bugs_logged || 0}</p>
          )}
        </Card>

        {/* Testcase Peer Review */}
        <Card className="p-6 bg-purple-50 border-purple-200">
          <div className="flex items-center space-x-2 mb-3">
            <CheckCircle className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-purple-900">Testcase Peer Review</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              value={editingMetrics.testcase_peer_review || 0}
              onChange={(e) => handleMetricChange('testcase_peer_review', parseInt(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-purple-700">{metrics.testcase_peer_review || 0}</p>
          )}
        </Card>

        {/* Regression Bugs Found */}
        <Card className="p-6 bg-red-50 border-red-200">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-red-900">Regression Bugs Found</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              value={editingMetrics.regression_bugs_found || 0}
              onChange={(e) => handleMetricChange('regression_bugs_found', parseInt(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-red-700">{metrics.regression_bugs_found || 0}</p>
          )}
        </Card>

        {/* Sanity Time Avg (hrs) */}
        <Card className="p-6 bg-indigo-50 border-indigo-200">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-indigo-900">Sanity Time Avg (hrs)</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              step="0.1"
              value={editingMetrics.sanity_time_avg_hours || 0}
              onChange={(e) => handleMetricChange('sanity_time_avg_hours', parseFloat(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-indigo-700">{metrics.sanity_time_avg_hours || 0}h</p>
          )}
        </Card>

        {/* API Test Time Avg (hrs) */}
        <Card className="p-6 bg-cyan-50 border-cyan-200">
          <div className="flex items-center space-x-2 mb-3">
            <Clock className="h-5 w-5 text-cyan-600" />
            <h3 className="font-semibold text-cyan-900">API Test Time Avg (hrs)</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              step="0.1"
              value={editingMetrics.api_test_time_avg_hours || 0}
              onChange={(e) => handleMetricChange('api_test_time_avg_hours', parseFloat(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-cyan-700">{metrics.api_test_time_avg_hours || 0}h</p>
          )}
        </Card>

        {/* Automation Coverage % */}
        <Card className="p-6 bg-emerald-50 border-emerald-200">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <h3 className="font-semibold text-emerald-900">Automation Coverage %</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              step="0.1"
              value={editingMetrics.automation_coverage_percent || 0}
              onChange={(e) => handleMetricChange('automation_coverage_percent', parseFloat(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-emerald-700">{metrics.automation_coverage_percent || 0}%</p>
          )}
        </Card>

        {/* Escaped Bugs (in Prod) */}
        <Card className="p-6 bg-rose-50 border-rose-200">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            <h3 className="font-semibold text-rose-900">Escaped Bugs (in Prod)</h3>
          </div>
          {editing ? (
            <Input
              type="number"
              value={editingMetrics.escaped_bugs || 0}
              onChange={(e) => handleMetricChange('escaped_bugs', parseInt(e.target.value) || 0)}
              className="text-2xl font-bold"
            />
          ) : (
            <p className="text-3xl font-bold text-rose-700">{metrics.escaped_bugs || 0}</p>
          )}
        </Card>
      </div>

      {/* Last Updated Info */}
      <Card className="p-4 bg-gray-50">
        <div className="flex items-center space-x-2">
          <FileText className="h-4 w-4 text-gray-600" />
          <span className="text-sm text-gray-600">
            Last updated: {metrics.updated_at ? new Date(metrics.updated_at).toLocaleString() : 'Never'}
          </span>
        </div>
      </Card>

      {/* Metrics History Table */}
      <Card className="p-6">
        <div className="flex items-center space-x-3 mb-6">
          <History className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-bold text-gray-900">Metrics History</h2>
          {historyLoading && (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          )}
        </div>

        {metricsHistory.length === 0 ? (
          <div className="text-center py-8">
            <History className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No metrics history found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No changes have been recorded for this Sub-PnL yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Change Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Changed By
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Key Metrics
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metricsHistory.map((historyItem, index) => {
                  const metricsData = parseMetricsData(historyItem.metrics_data);
                  const isLatest = index === 0;
                  
                  return (
                    <tr key={historyItem.id} className={isLatest ? "bg-blue-50" : "hover:bg-gray-50"}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getChangeTypeColor(
                            historyItem.change_type
                          )}`}
                        >
                          {historyItem.change_type.toUpperCase()}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>{formatDate(historyItem.created_at)}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center space-x-1">
                          <User className="h-4 w-4 text-gray-400" />
                          <span>{historyItem.user?.email || 'System'}</span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 space-y-1">
                          {Object.entries(metricsData).slice(0, 3).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="font-medium">{formatMetricName(key)}:</span>
                              <span className="ml-2">{value}{key.includes('percent') ? '%' : key.includes('hours') ? 'h' : ''}</span>
                            </div>
                          ))}
                          {Object.entries(metricsData).length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{Object.entries(metricsData).length - 3} more metrics
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLatest && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <Tag className="h-3 w-3 mr-1" />
                            Latest
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Navigation Flow Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2 text-sm text-blue-700">
          <span className="bg-blue-100 px-2 py-1 rounded">Dashboard</span>
          <ChevronRight className="h-4 w-4" />
          <span className="bg-blue-100 px-2 py-1 rounded">Sub-PnL List</span>
          <ChevronRight className="h-4 w-4" />
          <span className="bg-blue-200 px-2 py-1 rounded font-medium">Sub-PnL Details</span>
        </div>
      </Card>
    </div>
  );
};

export default SubPnLDetails;