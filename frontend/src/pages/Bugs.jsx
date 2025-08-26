import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
// import { bugsAPI, pnlAPI, releaseAPI } from '../services/api';
import { Plus, Bug } from 'lucide-react';

const Bugs = () => {
  const [bugs, setBugs] = useState([]);
  const [pnls, setPnls] = useState([]);
  const [releases, setReleases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium',
    bug_type: 'lower_env',
    pnl_id: '',
    release_id: '',
    assigned_to: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      // const releasesData = await releaseAPI.getAllReleases();
      
      // Initialize with empty data
      setBugs([]);
      setPnls([]);
      setReleases([]);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadReleases = async (pnlId) => {
    if (!pnlId) {
      setReleases([]);
      return;
    }
    try {
      const response = await releaseAPI.getAll(pnlId);
      setReleases(response.data);
    } catch (error) {
      console.error('Error loading releases:', error);
    }
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
      await bugsAPI.create({
        ...formData,
        pnl_id: parseInt(formData.pnl_id),
        release_id: parseInt(formData.release_id),
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null
      });
      setFormData({
        title: '',
        description: '',
        severity: 'medium',
        bug_type: 'lower_env',
        pnl_id: '',
        release_id: '',
        assigned_to: ''
      });
      setShowForm(false);
      loadData();
    } catch (error) {
      console.error('Error creating bug:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const getSeverityColor = (severity) => {
    const colors = {
      critical: 'bg-red-100 text-red-800',
      high: 'bg-orange-100 text-orange-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    return colors[severity] || colors.medium;
  };

  const getTypeColor = (type) => {
    const colors = {
      lower_env: 'bg-blue-100 text-blue-800',
      regression: 'bg-purple-100 text-purple-800',
      prod_escaped: 'bg-red-100 text-red-800'
    };
    return colors[type] || colors.lower_env;
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
        <h1 className="text-3xl font-bold text-gray-900">Bug Tracker</h1>
        <Button onClick={() => setShowForm(!showForm)} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Report Bug</span>
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Report New Bug</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  placeholder="Bug title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Detailed bug description"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Bug Type</label>
                  <select
                    name="bug_type"
                    value={formData.bug_type}
                    onChange={handleChange}
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="lower_env">Lower Environment</option>
                    <option value="regression">Regression</option>
                    <option value="prod_escaped">Production Escaped</option>
                  </select>
                </div>
              </div>

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
              
              <div className="flex space-x-2">
                <Button type="submit">Report Bug</Button>
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

      <div className="grid grid-cols-1 gap-4">
        {bugs.length === 0 ? (
          <div className="text-center py-12">
            <Bug className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No Bugs</h3>
            <p className="mt-1 text-sm text-gray-500">
              Great! No bugs reported yet.
            </p>
          </div>
        ) : (
          bugs.map((bug) => (
            <Card key={bug.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-lg">{bug.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(bug.severity)}`}>
                        {bug.severity.charAt(0).toUpperCase() + bug.severity.slice(1)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(bug.bug_type)}`}>
                        {bug.bug_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    
                    {bug.description && (
                      <p className="text-gray-600 mb-3">{bug.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span>PnL: {bug.pnl_id}</span>
                      <span>Release: {bug.release_id}</span>
                      <span>Status: {bug.status.replace('_', ' ')}</span>
                      <span>Reported: {new Date(bug.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default Bugs;