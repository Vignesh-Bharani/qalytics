import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
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
  AlertTriangle
} from 'lucide-react';

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

  // Load metrics from API
  useEffect(() => {
    fetchMetrics();
  }, [subPnlId]);

  const fetchMetrics = async () => {
    try {
      // TODO: Replace with actual API call
      const emptyMetrics = {
        features_shipped: 0,
        total_testcases_executed: 0,
        total_bugs_logged: 0,
        testcase_peer_review: 0,
        regression_bugs_found: 0,
        sanity_time_avg_hours: 0,
        api_test_time_avg_hours: 0,
        automation_coverage_percent: 0,
        escaped_bugs: 0,
        updated_at: new Date().toISOString()
      };
      setMetrics(emptyMetrics);
      setFormData(emptyMetrics);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      setLoading(false);
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
    // TODO: API call to save metrics
    setMetrics({ ...formData, updated_at: new Date().toISOString() });
    setIsEditing(false);
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: parseFloat(value) || 0
    });
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

  const EditableMetricCard = ({ icon: Icon, label, field, unit = '', target = null }) => (
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
                value={formData[field] || 0}
                onChange={(e) => handleInputChange(field, e.target.value)}
                className="mt-1"
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
            <span>Back to Sub-PnLs</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{subPnlName} - Metrics</h1>
            <p className="text-gray-600 mt-1">{pnlName} → {subPnlName} → Detailed Quality Metrics</p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={handleCancel} className="flex items-center space-x-2">
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button onClick={handleSave} className="flex items-center space-x-2">
                <Save className="h-4 w-4" />
                <span>Save Changes</span>
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="flex items-center space-x-2">
              <Edit3 className="h-4 w-4" />
              <span>Edit Metrics</span>
            </Button>
          )}
        </div>
      </div>

      {/* Core Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Core Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <EditableMetricCard
            icon={Package}
            label="Features Shipped"
            field="features_shipped"
          />
          
          <EditableMetricCard
            icon={TestTube}
            label="Total Test Cases Executed"
            field="total_testcases_executed"
          />
          
          <EditableMetricCard
            icon={Bug}
            label="Total Bugs Logged"
            field="total_bugs_logged"
          />
          
          <EditableMetricCard
            icon={Users}
            label="Test Case Peer Reviews"
            field="testcase_peer_review"
          />
          
          <EditableMetricCard
            icon={AlertTriangle}
            label="Regression Bugs Found"
            field="regression_bugs_found"
          />
          
          <EditableMetricCard
            icon={Bug}
            label="Escaped Bugs (Production)"
            field="escaped_bugs"
            target="0"
          />
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">⚡ Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <EditableMetricCard
            icon={Clock}
            label="Sanity Time Avg"
            field="sanity_time_avg_hours"
            unit="h"
            target="≤3h"
          />
          
          <EditableMetricCard
            icon={Activity}
            label="API Test Time Avg"
            field="api_test_time_avg_hours"
            unit="h"
          />
          
          <EditableMetricCard
            icon={Zap}
            label="Automation Coverage"
            field="automation_coverage_percent"
            unit="%"
            target="≥70%"
          />
        </div>
      </div>

      {/* Calculated KPIs */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">📊 Calculated KPIs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            icon={CheckCircle2}
            label="Bug-Based Coverage"
            value={derived.bugBasedCoverage}
            unit="%"
            target="≥98%"
            isGood={parseFloat(derived.bugBasedCoverage) >= 98}
          />
          
          <MetricCard
            icon={TestTube}
            label="Test Cases per Bug"
            value={derived.testcasesPerBug}
            isGood={parseFloat(derived.testcasesPerBug) >= 5.6}
          />
          
          <MetricCard
            icon={Bug}
            label="Bugs per 100 Tests"
            value={derived.bugsPer100Tests}
            isGood={parseFloat(derived.bugsPer100Tests) <= 17.9}
          />
          
          <MetricCard
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
  );
};

export default SubPnLMetrics;