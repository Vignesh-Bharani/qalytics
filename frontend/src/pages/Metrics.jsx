import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
// import { metricsAPI, pnlAPI, releaseAPI } from '../services/api';
import { Plus, BarChart3 } from 'lucide-react';

const Metrics = () => {
  const [metrics, setMetrics] = useState([]);
  const [pnls, setPnls] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    pnl_id: '',
    release_id: '',
    test_cases_executed: 0,
    coverage_percentage: 0,
    automation_adoption_percentage: 0,
    lower_env_bugs: 0,
    regression_bugs: 0,
    prod_escaped_bugs: 0,
    sanity_execution_time_hours: 0,
    api_execution_time_hours: 0,
    peer_reviews_count: 0,
    metric_date: new Date().toISOString().split('T')[0]
  });

  const loadData = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API calls
      // const metricsData = await metricsAPI.getAllMetrics();
      // const pnlsData = await pnlAPI.getAllPnls();
      // const releasesData = await releaseAPI.getAllReleases();
      
      // Initialize with empty data
      setMetrics([]);
      setPnls([]);
      setReleases([]);
      setLoading(false);
      
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const loadReleases = async (pnlId) => {
    if (!pnlId) {
      setReleases([]);
      return;
    }
    // TODO: Replace with actual API call
    // const response = await releaseAPI.getAll(pnlId);
    // setReleases(response.data);
    setReleases([]);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (formData.pnl_id) {
      loadReleases(formData.pnl_id);
    }
  }, [formData.pnl_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Simulate API call with timeout
      console.log('Submitting metrics:', formData);
      
      // Add the new metric to the existing list
      const newMetric = {
        id: Date.now(),
        ...formData,
        pnl_id: parseInt(formData.pnl_id),
        release_id: parseInt(formData.release_id),
        test_cases_executed: parseInt(formData.test_cases_executed),
        coverage_percentage: parseFloat(formData.coverage_percentage),
        automation_adoption_percentage: parseFloat(formData.automation_adoption_percentage),
        lower_env_bugs: parseInt(formData.lower_env_bugs),
        regression_bugs: parseInt(formData.regression_bugs),
        prod_escaped_bugs: parseInt(formData.prod_escaped_bugs),
        sanity_execution_time_hours: parseFloat(formData.sanity_execution_time_hours),
        api_execution_time_hours: parseFloat(formData.api_execution_time_hours),
        peer_reviews_count: parseInt(formData.peer_reviews_count),
        created_at: new Date().toISOString()
      };
      
      setMetrics(prev => [newMetric, ...prev]);
      setFormData({
        pnl_id: '',
        release_id: '',
        test_cases_executed: 0,
        coverage_percentage: 0,
        automation_adoption_percentage: 0,
        lower_env_bugs: 0,
        regression_bugs: 0,
        prod_escaped_bugs: 0,
        sanity_execution_time_hours: 0,
        api_execution_time_hours: 0,
        peer_reviews_count: 0,
        metric_date: new Date().toISOString().split('T')[0]
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating metric:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">QA Metrics</h1>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Metrics</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PnL</label>
                  <select
                    name="pnl_id"
                    value={formData.pnl_id}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select PnL</option>
                    {pnls.map((pnl) => (
                      <option key={pnl.id} value={pnl.id}>
                        {pnl.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Release</label>
                  <select
                    name="release_id"
                    value={formData.release_id}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">Select Release</option>
                    {releases.map((release) => (
                      <option key={release.id} value={release.id}>
                        {release.name} ({release.version})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Test Cases Executed</label>
                  <Input
                    type="number"
                    name="test_cases_executed"
                    value={formData.test_cases_executed}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Coverage %</label>
                  <Input
                    type="number"
                    name="coverage_percentage"
                    value={formData.coverage_percentage}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Automation Adoption %</label>
                  <Input
                    type="number"
                    name="automation_adoption_percentage"
                    value={formData.automation_adoption_percentage}
                    onChange={handleChange}
                    required
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Lower Env Bugs</label>
                  <Input
                    type="number"
                    name="lower_env_bugs"
                    value={formData.lower_env_bugs}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Regression Bugs</label>
                  <Input
                    type="number"
                    name="regression_bugs"
                    value={formData.regression_bugs}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Production Escaped Bugs</label>
                  <Input
                    type="number"
                    name="prod_escaped_bugs"
                    value={formData.prod_escaped_bugs}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Sanity Execution Time (hours)</label>
                  <Input
                    type="number"
                    name="sanity_execution_time_hours"
                    value={formData.sanity_execution_time_hours}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">API Execution Time (hours)</label>
                  <Input
                    type="number"
                    name="api_execution_time_hours"
                    value={formData.api_execution_time_hours}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Peer Reviews Count</label>
                  <Input
                    type="number"
                    name="peer_reviews_count"
                    value={formData.peer_reviews_count}
                    onChange={handleChange}
                    required
                    min="0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Metric Date</label>
                <Input
                  type="date"
                  name="metric_date"
                  value={formData.metric_date}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="flex space-x-2">
                <Button type="submit">Add Metrics</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        {metrics.length === 0 ? (
          <div className="text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No Metrics</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by adding your first metrics data.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PnL</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Cases</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coverage %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Automation %</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bugs</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exec Time (h)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peer Reviews</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.map((metric) => (
                  <tr key={metric.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(metric.metric_date || metric.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      PnL {metric.pnl_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.test_cases_executed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.coverage_percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.automation_adoption_percentage}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.lower_env_bugs + metric.regression_bugs + metric.prod_escaped_bugs}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {(metric.sanity_execution_time_hours + metric.api_execution_time_hours).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {metric.peer_reviews_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Metrics;