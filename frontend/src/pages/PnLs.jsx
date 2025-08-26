import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { pnlAPI } from '../services/api';
import { Building2, Plus, TrendingUp, Bug, TestTube, Percent, ChevronRight } from 'lucide-react';

const PnLs = () => {
  const [pnls, setPnls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchPnls();
  }, []);

  const fetchPnls = async () => {
    try {
      const response = await pnlAPI.getAll();
      setPnls(response.data);
    } catch (error) {
      console.error('Error fetching PnLs:', error);
      setError('Failed to fetch PnLs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await pnlAPI.create(formData);

      // Add the new PnL to the list
      setPnls([...pnls, response.data]);
      
      // Reset form
      setFormData({ name: '', description: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating PnL:', error);
      setError('Failed to create PnL');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const viewSubPnLs = (pnlId, pnlName) => {
    navigate(`/pnls/${pnlId}/sub-pnls`, {
      state: { pnlName }
    });
  };

  const viewPnLDetails = (pnlId, pnlName) => {
    navigate(`/pnls/${pnlId}`, {
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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">PnLs</h1>
            <p className="text-gray-600 mt-2">Manage your Product & Lines</p>
          </div>
          <Button 
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add New PnL
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Create PnL Form */}
        {showCreateForm && (
          <Card className="mb-8 p-6">
            <h2 className="text-xl font-semibold mb-4">Create New PnL</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <Input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter PnL name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <Input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter PnL description"
                />
              </div>
              <div className="flex gap-3">
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Create PnL
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* PnL Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pnls.map((pnl) => (
            <Card key={pnl.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{pnl.name}</h3>
                    <p className="text-sm text-gray-600">{pnl.description}</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                    <TestTube className="w-4 h-4" />
                    <span className="text-xs font-medium">Test Cases</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {pnl.metrics?.total_testcases || 0}
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Percent className="w-4 h-4" />
                    <span className="text-xs font-medium">Coverage</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {pnl.metrics?.test_coverage_percent || 0}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-medium">Automation</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {pnl.metrics?.automation_percent || 0}%
                  </p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
                    <Bug className="w-4 h-4" />
                    <span className="text-xs font-medium">Prod Bugs</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {pnl.metrics?.prod_bugs || 0}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => viewPnLDetails(pnl.id, pnl.name)}
                  className="flex-1 flex items-center justify-center gap-1"
                >
                  View Details
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => viewSubPnLs(pnl.id, pnl.name)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-1"
                >
                  Sub PnLs
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {pnls.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No PnLs found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first PnL</p>
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New PnL
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PnLs;