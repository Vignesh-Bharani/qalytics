import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import api, { metricsHistoryAPI } from '../services/api';
import { 
  ArrowLeft, 
  Edit3, 
  Save, 
  X,
  Package, 
  TestTube,
  Bug,
  Clock,
  Zap,
  Users,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Plus,
  History,
  Trash2,
  Calendar,
  User as UserIcon
} from 'lucide-react';

// Define components outside the main component to prevent re-creation
const MetricCard = ({ icon: Icon, label, value, unit = '', target = null, isGood = null }) => (
  <Card className="relative">
    <CardContent className="p-4">
      <div className="flex items-center space-x-3">
        <div className={`p-2 rounded-lg ${isGood === true ? 'bg-green-100' : isGood === false ? 'bg-red-100' : 'bg-blue-100'}`}>
          <Icon className={`h-4 w-4 ${isGood === true ? 'text-green-600' : isGood === false ? 'text-red-600' : 'text-blue-600'}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}{unit}</p>
          {target && (
            <p className="text-xs text-gray-500">Target: {target}</p>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

const EditableMetricCard = React.memo(({ 
  icon: Icon, 
  label, 
  field, 
  unit = '', 
  target = null, 
  isEditing, 
  metrics, 
  formData, 
  onInputChange 
}) => {
  const [localValue, setLocalValue] = useState('');

  // Initialize local value when editing starts or formData changes
  useEffect(() => {
    if (isEditing) {
      const currentValue = formData[field];
      setLocalValue(currentValue !== undefined && currentValue !== null ? String(currentValue) : '');
    }
  }, [isEditing, formData, field]);

  const handleChange = useCallback((e) => {
    const value = e.target.value;
    setLocalValue(value);
    onInputChange(field, value);
  }, [field, onInputChange]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-lg bg-blue-100">
            <Icon className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            {isEditing ? (
              <Input
                type="number"
                step={field.includes('hours') || field.includes('percent') ? '0.1' : '1'}
                value={localValue}
                onChange={handleChange}
                className="mt-1"
                placeholder="0"
              />
            ) : (
              <p className="text-2xl font-bold text-gray-900">{metrics[field] || 0}{unit}</p>
            )}
            {target && (
              <p className="text-xs text-gray-500">Target: {target}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

EditableMetricCard.displayName = 'EditableMetricCard';

const SubPnLMetrics = () => {
  const { subPnlId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const subPnlName = location.state?.subPnlName || 'Sub-PnL';
  const pnlName = location.state?.pnlName || 'PnL';
  
  const [metrics, setMetrics] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('metrics');
  const [history, setHistory] = useState([]);
  const [subPnlDetails, setSubPnlDetails] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Load all data on component mount
  useEffect(() => {
    loadAllData();
  }, [subPnlId]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load Sub-PnL details
      const detailsResponse = await api.get(`/sub-pnls/${subPnlId}`);
      setSubPnlDetails(detailsResponse.data);
      
      // Load current metrics
      const metricsResponse = await api.get(`/sub-pnls/${subPnlId}/detail-metrics`);
      const metricsData = metricsResponse.data;
      
      // Set the loaded metrics data
      setMetrics(metricsData);
      setFormData(metricsData);
      
      // Load history (with timeout protection)
      await loadHistory();
      
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load metrics data');
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );
      
      const historyPromise = api.get(`/sub-pnls/${subPnlId}/metrics-history`);
      const historyResponse = await Promise.race([historyPromise, timeoutPromise]);
      
      setHistory(historyResponse.data || []);
    } catch (err) {
      console.error('Error loading history:', err);
      setHistory([]);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setFormData({ ...metrics });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ ...metrics });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Convert string values to numbers before sending
      const dataToSend = {};
      Object.keys(formData).forEach(key => {
        const value = formData[key];
        dataToSend[key] = value === '' ? 0 : (typeof value === 'string' ? parseFloat(value) || 0 : value);
      });
      
      const updateResponse = await api.put(`/sub-pnls/${subPnlId}/detail-metrics`, dataToSend);
      
      // Update local state
      setMetrics({ ...updateResponse.data });
      setIsEditing(false);
      
      // Reload history
      await loadHistory();
      
      // Switch to history tab
      setActiveTab('history');
      
    } catch (err) {
      console.error('Error saving metrics:', err);
      setError('Failed to save metrics');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = useCallback((field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value === '' ? '' : (parseFloat(value) || 0)
    }));
  }, []);

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

  const calculateDerivedMetrics = () => {
    const bugBasedCoverage = metrics.total_bugs_logged > 0 
      ? ((metrics.total_bugs_logged / (metrics.total_bugs_logged + metrics.escaped_bugs)) * 100).toFixed(1)
      : 0;
    
    const testcasesPerBug = metrics.total_bugs_logged > 0
      ? (metrics.total_testcases_executed / metrics.total_bugs_logged).toFixed(1)
      : 0;
    
    const bugsPer100Tests = metrics.total_testcases_executed > 0
      ? ((metrics.total_bugs_logged / metrics.total_testcases_executed) * 100).toFixed(1)
      : 0;
    
    const peerReviewPercentage = metrics.total_testcases_executed > 0
      ? ((metrics.testcase_peer_review / metrics.total_testcases_executed) * 100).toFixed(1)
      : 0;

    return {
      bugBasedCoverage,
      testcasesPerBug,
      bugsPer100Tests,
      peerReviewPercentage
    };
  };

  const derived = calculateDerivedMetrics();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Metrics - {subPnlDetails?.name || subPnlName}
            </h1>
            <p className="text-gray-600 mt-1">
              {subPnlDetails?.description || 'Detailed Quality Metrics'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Tab Navigation */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'metrics'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Package className="h-4 w-4" />
              <span>Metrics</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </button>
          </div>
          
          {/* Action Buttons */}
          {activeTab === 'metrics' && (
            <div className="flex space-x-2">
              {isEditing ? (
                <>
                  <Button 
                    variant="outline" 
                    onClick={handleCancel} 
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancel</span>
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={saving}
                    className="flex items-center space-x-2"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                </>
              ) : (
                <Button onClick={handleEdit} className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Update Metrics</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Metrics Tab Content */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Core Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Core Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableMetricCard
                key="features_shipped"
                icon={Package}
                label="Features Shipped"
                field="features_shipped"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <EditableMetricCard
                key="total_testcases_executed"
                icon={TestTube}
                label="Total Test Cases Executed"
                field="total_testcases_executed"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <EditableMetricCard
                key="total_bugs_logged"
                icon={Bug}
                label="Total Bugs Logged"
                field="total_bugs_logged"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <EditableMetricCard
                key="testcase_peer_review"
                icon={Users}
                label="Test Case Peer Reviews"
                field="testcase_peer_review"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <EditableMetricCard
                key="regression_bugs_found"
                icon={AlertTriangle}
                label="Regression Bugs Found"
                field="regression_bugs_found"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <EditableMetricCard
                key="escaped_bugs"
                icon={Bug}
                label="Escaped Bugs (Production)"
                field="escaped_bugs"
                target="0"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </div>
          </div>

          {/* Performance Metrics */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Metrics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <EditableMetricCard
                key="sanity_time_avg_hours"
                icon={Clock}
                label="Sanity Time Avg"
                field="sanity_time_avg_hours"
                unit="h"
                target="≤3h"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <EditableMetricCard
                key="api_test_time_avg_hours"
                icon={Activity}
                label="API Test Time Avg"
                field="api_test_time_avg_hours"
                unit="h"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
              
              <EditableMetricCard
                key="automation_coverage_percent"
                icon={Zap}
                label="Automation Coverage"
                field="automation_coverage_percent"
                unit="%"
                target="≥70%"
                isEditing={isEditing}
                metrics={metrics}
                formData={formData}
                onInputChange={handleInputChange}
              />
            </div>
          </div>

          {/* Calculated KPIs */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Calculated KPIs</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                key="bug-based-coverage"
                icon={CheckCircle2}
                label="Bug-Based Coverage"
                value={derived.bugBasedCoverage}
                unit="%"
                target="≥98%"
                isGood={parseFloat(derived.bugBasedCoverage) >= 98}
              />
              
              <MetricCard
                key="testcases-per-bug"
                icon={TestTube}
                label="Test Cases per Bug"
                value={derived.testcasesPerBug}
                isGood={parseFloat(derived.testcasesPerBug) >= 5.6}
              />
              
              <MetricCard
                key="bugs-per-100-tests"
                icon={Bug}
                label="Bugs per 100 Tests"
                value={derived.bugsPer100Tests}
                isGood={parseFloat(derived.bugsPer100Tests) <= 17.9}
              />
              
              <MetricCard
                key="peer-review-coverage"
                icon={Users}
                label="Peer Review Coverage"
                value={derived.peerReviewPercentage}
                unit="%"
                isGood={parseFloat(derived.peerReviewPercentage) >= 80}
              />
            </div>
          </div>

          {/* Last Updated */}
          {metrics.updated_at && (
            <div className="text-sm text-gray-500 text-center p-4 bg-gray-50 rounded-lg">
              Last updated: {new Date(metrics.updated_at).toLocaleString()}
            </div>
          )}
        </div>
      )}

      {/* History Tab Content */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          
          {history.length === 0 ? (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No history found</h3>
              <p className="mt-1 text-sm text-gray-500">
                No metrics changes have been recorded yet. Try updating some metrics first.
              </p>
              <Button 
                variant="outline" 
                onClick={loadHistory} 
                className="mt-2"
              >
                Refresh History
              </Button>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {history.map((item) => (
                  <li key={item.id} className="px-6 py-4">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          item.change_type === 'create' ? 'bg-green-500' :
                          item.change_type === 'update' ? 'bg-blue-500' :
                          item.change_type === 'delete' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.change_type === 'create' ? 'bg-green-100 text-green-800' :
                              item.change_type === 'update' ? 'bg-blue-100 text-blue-800' :
                              item.change_type === 'delete' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {item.change_type.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-gray-900">
                              {item.entity_type.replace('_', ' ').toUpperCase()} #{item.entity_id}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-sm text-gray-500">
                              {new Date(item.created_at).toLocaleString()}
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
                          <div className="mt-2 text-xs text-gray-500">
                            Changed by: {item.user.email}
                          </div>
                        )}
                        
                        <div className="mt-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-900 mb-2">Metrics Data:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                              {(() => {
                                try {
                                  const data = JSON.parse(item.metrics_data);
                                  return Object.entries(data).map(([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="font-medium">
                                        {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                      </span> {value}
                                    </div>
                                  ));
                                } catch {
                                  return <div className="text-xs text-gray-500">Invalid data format</div>;
                                }
                              })()}
                            </div>
                          </div>
                          
                          {item.previous_values && (
                            <div className="mt-2 bg-yellow-50 rounded-lg p-3">
                              <h4 className="text-sm font-medium text-gray-900 mb-2">Previous Values:</h4>
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {(() => {
                                  try {
                                    const data = JSON.parse(item.previous_values);
                                    return Object.entries(data).map(([key, value]) => (
                                      <div key={key} className="text-xs">
                                        <span className="font-medium">
                                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                                        </span> {value}
                                      </div>
                                    ));
                                  } catch {
                                    return <div className="text-xs text-gray-500">Invalid data format</div>;
                                  }
                                })()}
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
      )}
    </div>
  );
};

export default SubPnLMetrics;