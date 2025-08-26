import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { pnlAPI } from '../services/api';
import { 
  Building2, 
  ArrowLeft, 
  Edit, 
  Save, 
  X, 
  TrendingUp, 
  Bug, 
  TestTube, 
  Percent,
  Target,
  AlertCircle,
  History
} from 'lucide-react';

const PnLDetails = () => {
  const { pnlId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const pnlName = location.state?.pnlName || 'PnL';
  
  const [pnl, setPnl] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingMetrics, setEditingMetrics] = useState(false);
  const [metricsForm, setMetricsForm] = useState({});

  useEffect(() => {
    fetchPnLDetails();
  }, [pnlId]);

  const fetchPnLDetails = async () => {
    try {
      const [pnlResponse, metricsResponse] = await Promise.all([
        pnlAPI.getById(pnlId),
        pnlAPI.getMetrics(pnlId)
      ]);
      
      setPnl(pnlResponse.data);
      setMetrics(metricsResponse.data);
      setMetricsForm(metricsResponse.data);
    } catch (error) {
      console.error('Error fetching PnL details:', error);
      setError('Failed to fetch PnL details');
    } finally {
      setLoading(false);
    }
  };

  const handleMetricsUpdate = async () => {
    try {
      const response = await pnlAPI.updateMetrics(pnlId, metricsForm);
      setMetrics(response.data);
      setEditingMetrics(false);
    } catch (error) {
      console.error('Error updating metrics:', error);
      setError('Failed to update metrics');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMetricsForm(prev => ({
      ...prev,
      [name]: parseFloat(value) || 0
    }));
  };

  const goToSubPnLs = () => {
    navigate(`/pnls/${pnlId}/sub-pnls`, {
      state: { pnlName }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => navigate('/pnls')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to PnLs
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{pnl?.name}</h1>
                <p className="text-gray-600">{pnl?.description}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => navigate(`/pnls/${pnlId}/metrics-history`)}
              className="flex items-center gap-2"
            >
              <History className="w-4 h-4" />
              Metrics History
            </Button>
            <Button 
              onClick={goToSubPnLs}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              View Sub PnLs
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <TestTube className="w-5 h-5" />
                  <span className="text-sm font-medium">Total Test Cases</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.total_testcases || 0}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Percent className="w-5 h-5" />
                  <span className="text-sm font-medium">Test Coverage</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.test_coverage_percent || 0}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">Automation</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.automation_percent || 0}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-red-600 mb-2">
                  <Bug className="w-5 h-5" />
                  <span className="text-sm font-medium">Production Bugs</span>
                </div>
                <p className="text-3xl font-bold text-gray-900">
                  {metrics?.prod_bugs || 0}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Metrics</h2>
            {!editingMetrics ? (
              <Button 
                variant="outline" 
                onClick={() => setEditingMetrics(true)}
                className="flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Metrics
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button 
                  onClick={handleMetricsUpdate}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setEditingMetrics(false);
                    setMetricsForm(metrics);
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Test Cases
              </label>
              {editingMetrics ? (
                <Input
                  type="number"
                  name="total_testcases"
                  value={metricsForm.total_testcases || 0}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">
                  {metrics?.total_testcases || 0}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Coverage Percentage
              </label>
              {editingMetrics ? (
                <Input
                  type="number"
                  step="0.1"
                  name="test_coverage_percent"
                  value={metricsForm.test_coverage_percent || 0}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">
                  {metrics?.test_coverage_percent || 0}%
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Automation Percentage
              </label>
              {editingMetrics ? (
                <Input
                  type="number"
                  step="0.1"
                  name="automation_percent"
                  value={metricsForm.automation_percent || 0}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">
                  {metrics?.automation_percent || 0}%
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Lower Environment Bugs
              </label>
              {editingMetrics ? (
                <Input
                  type="number"
                  name="lower_env_bugs"
                  value={metricsForm.lower_env_bugs || 0}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">
                  {metrics?.lower_env_bugs || 0}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Production Bugs
              </label>
              {editingMetrics ? (
                <Input
                  type="number"
                  name="prod_bugs"
                  value={metricsForm.prod_bugs || 0}
                  onChange={handleInputChange}
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">
                  {metrics?.prod_bugs || 0}
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PnLDetails;