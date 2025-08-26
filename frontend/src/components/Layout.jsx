import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  LogOut,
  User,
  Building2,
  History
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'PnLs', href: '/pnls', icon: Building2 },
    { name: 'Metrics History', href: '/metrics-history', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-900">QAlytics</h1>
                <p className="text-xs text-gray-500">Quality Analytics Platform</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  {user?.email || 'QA Engineer'}
                </span>
                <span className="text-xs text-gray-500 capitalize">
                  ({user?.role?.replace('_', ' ') || 'user'})
                </span>
              </div>

              <button 
                onClick={logout}
                className="flex items-center space-x-1 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-4">
            <div className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-blue-900 text-white'
                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                      }`
                    }
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;