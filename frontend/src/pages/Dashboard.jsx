import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  Building2, 
  BarChart3, 
  Bug, 
  TestTube, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Activity,
  Award,
  CheckCircle
} from 'lucide-react';

const Dashboard = () => {
  const [pnls, setPnls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calculate overall KPIs
  const [kpis, setKpis] = useState({
    totalPnLs: 0,
    totalTestCases: 0,
    averageCoverage: 0,
    averageAutomation: 0,
    totalLowerEnvBugs: 0,
    totalProdBugs: 0,
    testCasesPerBug: 0,
    bugsPerHundredTests: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await dashboardAPI.getDashboard();
      setPnls(response.data);
      
      // Calculate KPIs
      const data = response.data;
      const totalPnLs = data.length;
      const totalTestCases = data.reduce((sum, pnl) => sum + (pnl.metrics?.total_testcases || 0), 0);
      const totalLowerEnvBugs = data.reduce((sum, pnl) => sum + (pnl.metrics?.lower_env_bugs || 0), 0);
      const totalProdBugs = data.reduce((sum, pnl) => sum + (pnl.metrics?.prod_bugs || 0), 0);
      const totalBugs = totalLowerEnvBugs + totalProdBugs;
      
      const averageCoverage = totalPnLs > 0 ? 
        data.reduce((sum, pnl) => sum + (pnl.metrics?.test_coverage_percent || 0), 0) / totalPnLs : 0;
      const averageAutomation = totalPnLs > 0 ? 
        data.reduce((sum, pnl) => sum + (pnl.metrics?.automation_percent || 0), 0) / totalPnLs : 0;
      
      const testCasesPerBug = totalBugs > 0 ? totalTestCases / totalBugs : 0;
      const bugsPerHundredTests = totalTestCases > 0 ? (totalBugs / totalTestCases) * 100 : 0;

      setKpis({
        totalPnLs,
        totalTestCases,
        averageCoverage: Math.round(averageCoverage * 10) / 10,
        averageAutomation: Math.round(averageAutomation * 10) / 10,
        totalLowerEnvBugs,
        totalProdBugs,
        testCasesPerBug: Math.round(testCasesPerBug * 10) / 10,
        bugsPerHundredTests: Math.round(bugsPerHundredTests * 100) / 100
      });
    } catch (err) {
      setError('Failed to fetch dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">{error}</p>
            <Button onClick={fetchDashboardData} className="mt-2">
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">QAlytics Dashboard</h1>
          <p className="text-lg text-gray-600">Key Performance Indicators Overview</p>
        </div>

        {/* Primary KPIs - Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total PnLs</p>
                <p className="text-4xl font-bold">{kpis.totalPnLs}</p>
                <p className="text-blue-100 text-xs mt-1">Active Product Lines</p>
              </div>
              <div className="p-3 bg-blue-400 bg-opacity-30 rounded-full">
                <Building2 className="h-8 w-8" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Test Cases</p>
                <p className="text-4xl font-bold">{kpis.totalTestCases.toLocaleString()}</p>
                <p className="text-green-100 text-xs mt-1">Across All PnLs</p>
              </div>
              <div className="p-3 bg-green-400 bg-opacity-30 rounded-full">
                <TestTube className="h-8 w-8" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg Test Coverage</p>
                <p className="text-4xl font-bold">{kpis.averageCoverage}%</p>
                <p className="text-purple-100 text-xs mt-1">Quality Metric</p>
              </div>
              <div className="p-3 bg-purple-400 bg-opacity-30 rounded-full">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Avg Automation</p>
                <p className="text-4xl font-bold">{kpis.averageAutomation}%</p>
                <p className="text-indigo-100 text-xs mt-1">Efficiency Metric</p>
              </div>
              <div className="p-3 bg-indigo-400 bg-opacity-30 rounded-full">
                <TrendingUp className="h-8 w-8" />
              </div>
            </div>
          </Card>
        </div>

        {/* Secondary KPIs - Detailed Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bug className="h-6 w-6 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-500">Environment</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">{kpis.totalLowerEnvBugs}</p>
              <p className="text-sm text-gray-600">Lower Environment Bugs</p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Critical</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">{kpis.totalProdBugs}</p>
              <p className="text-sm text-gray-600">Production Bugs</p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Target className="h-6 w-6 text-cyan-600" />
              </div>
              <span className="text-sm text-gray-500">Ratio</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">{kpis.testCasesPerBug}</p>
              <p className="text-sm text-gray-600">Test Cases per Bug</p>
            </div>
          </Card>

          <Card className="p-6 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Activity className="h-6 w-6 text-orange-600" />
              </div>
              <span className="text-sm text-gray-500">Rate</span>
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold text-gray-900">{kpis.bugsPerHundredTests}</p>
              <p className="text-sm text-gray-600">Bugs per 100 Tests</p>
            </div>
          </Card>
        </div>

        {/* Quality Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Quality Insights
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium text-gray-700">Test Coverage</span>
                </div>
                <span className={`text-sm font-bold ${kpis.averageCoverage >= 80 ? 'text-green-600' : kpis.averageCoverage >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {kpis.averageCoverage >= 80 ? 'Excellent' : kpis.averageCoverage >= 60 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Automation Rate</span>
                </div>
                <span className={`text-sm font-bold ${kpis.averageAutomation >= 70 ? 'text-green-600' : kpis.averageAutomation >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {kpis.averageAutomation >= 70 ? 'Excellent' : kpis.averageAutomation >= 50 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-purple-500" />
                  <span className="text-sm font-medium text-gray-700">Bug Detection Rate</span>
                </div>
                <span className={`text-sm font-bold ${kpis.testCasesPerBug >= 50 ? 'text-green-600' : kpis.testCasesPerBug >= 20 ? 'text-yellow-600' : 'text-red-600'}`}>
                  {kpis.testCasesPerBug >= 50 ? 'Excellent' : kpis.testCasesPerBug >= 20 ? 'Good' : 'Needs Improvement'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Performance Summary
            </h3>
            <div className="space-y-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-3xl font-bold text-gray-900 mb-1">
                  {((kpis.averageCoverage + kpis.averageAutomation) / 2).toFixed(1)}%
                </div>
                <p className="text-sm text-gray-600">Overall Quality Score</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-700">
                    {Math.round((kpis.totalLowerEnvBugs / (kpis.totalLowerEnvBugs + kpis.totalProdBugs || 1)) * 100)}%
                  </div>
                  <p className="text-xs text-green-600">Bugs Caught Early</p>
                </div>
                
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-700">
                    {kpis.totalPnLs}
                  </div>
                  <p className="text-xs text-blue-600">Active PnLs</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Info */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Explore Your Data</h3>
              <p className="text-blue-700">
                Navigate to PnLs section to view detailed metrics, manage Sub-PnLs, and track individual performance.
              </p>
            </div>
            <div className="text-6xl text-blue-200">
              📊
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;