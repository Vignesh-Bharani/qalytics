import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { subPnlAPI, pnlAPI } from '../services/api';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building2, ChevronRight, ChevronLeft, Package, TestTube, Bug, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

const SubPnLs = () => {
  const { pnlId } = useParams();
  const navigate = useNavigate();
  const [pnl, setPnl] = useState(null);
  const [subPnls, setSubPnls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (pnlId) {
      fetchData();
    }
  }, [pnlId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch PnL details and sub PnLs
      const [pnlResponse, subPnlsResponse] = await Promise.all([
        pnlAPI.getById(pnlId),
        subPnlAPI.getByPnL(pnlId)
      ]);
      
      setPnl(pnlResponse.data);
      setSubPnls(subPnlsResponse.data);
    } catch (err) {
      setError('Failed to fetch Sub-PnL data');
      console.error('Sub-PnL error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubPnLClick = (subPnlId) => {
    navigate(`/sub-pnl-details/${subPnlId}`);
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
          <Button onClick={fetchData}>Retry</Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Breadcrumb */}
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <button 
          onClick={() => navigate('/pnls')}
          className="hover:text-blue-600 flex items-center space-x-1"
        >
          <span>PnLs</span>
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-gray-900 font-medium">{pnl?.name}</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate('/pnls')}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to PnLs</span>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">{pnl?.name} - Sub-PnLs</h1>
          <p className="text-gray-600">{pnl?.description}</p>
          <p className="text-sm text-gray-500 mt-1">Click on any Sub-PnL to view detailed metrics</p>
        </div>
      </div>

      {/* Sub-PnL Cards */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Sub-PnLs ({subPnls.length})
        </h2>
        
        {subPnls.length === 0 ? (
          <Card className="p-8 text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No Sub-PnLs</h3>
            <p className="mt-1 text-sm text-gray-500">
              This PnL doesn't have any Sub-PnLs yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {subPnls.map((subPnl) => (
              <Card 
                key={subPnl.id} 
                className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
                onClick={() => handleSubPnLClick(subPnl.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Package className="h-5 w-5 text-green-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{subPnl.name}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{subPnl.description}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400" />
                </div>
                
                {/* KPI Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Package className="h-4 w-4 text-blue-600" />
                      <div className="text-lg font-bold text-blue-700">
                        {subPnl.metrics?.features_shipped || 0}
                      </div>
                    </div>
                    <div className="text-xs text-blue-600">Features Shipped</div>
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <TestTube className="h-4 w-4 text-green-600" />
                      <div className="text-lg font-bold text-green-700">
                        {subPnl.metrics?.total_testcases_executed || 0}
                      </div>
                    </div>
                    <div className="text-xs text-green-600">Total Testcases Executed</div>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bug className="h-4 w-4 text-yellow-600" />
                      <div className="text-lg font-bold text-yellow-700">
                        {subPnl.metrics?.total_bugs_logged || 0}
                      </div>
                    </div>
                    <div className="text-xs text-yellow-600">Total Bugs Logged</div>
                  </div>
                  
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <div className="text-lg font-bold text-red-700">
                        {subPnl.metrics?.regression_bugs_found || 0}
                      </div>
                    </div>
                    <div className="text-xs text-red-600">Regression Bugs Found</div>
                  </div>
                </div>
                
                {/* Additional Metrics */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="text-center bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-center space-x-1">
                      <Clock className="h-3 w-3 text-gray-600" />
                      <div className="text-sm font-semibold text-gray-700">
                        {subPnl.metrics?.sanity_time_avg_hours || 0}h
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Sanity Time Avg</div>
                  </div>
                  
                  <div className="text-center bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-center space-x-1">
                      <TrendingUp className="h-3 w-3 text-gray-600" />
                      <div className="text-sm font-semibold text-gray-700">
                        {subPnl.metrics?.automation_coverage_percent || 0}%
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Automation Coverage</div>
                  </div>
                  
                  <div className="text-center bg-gray-50 p-2 rounded">
                    <div className="flex items-center justify-center space-x-1">
                      <AlertTriangle className="h-3 w-3 text-gray-600" />
                      <div className="text-sm font-semibold text-gray-700">
                        {subPnl.metrics?.escaped_bugs || 0}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Escaped Bugs</div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubPnLClick(subPnl.id);
                    }}
                  >
                    View Detailed Metrics →
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Flow Info */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-center space-x-2 text-sm text-blue-700">
          <span className="bg-blue-100 px-2 py-1 rounded">Dashboard</span>
          <ChevronRight className="h-4 w-4" />
          <span className="bg-blue-200 px-2 py-1 rounded font-medium">Sub-PnL List</span>
          <ChevronRight className="h-4 w-4" />
          <span className="bg-blue-100 px-2 py-1 rounded">Sub-PnL Details</span>
        </div>
        <p className="text-xs text-blue-600 mt-1">
          Click on any Sub-PnL card above to view detailed metrics and edit capabilities.
        </p>
      </Card>
    </div>
  );
};

export default SubPnLs;