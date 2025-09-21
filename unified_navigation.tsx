import React, { useState, useEffect } from 'react';
import { Menu, X, ChevronDown, Search, Bell, User, Home, TrendingUp, DollarSign, Settings, HelpCircle, Zap, Users, Calendar, BarChart3, Wallet, Globe, Shield } from 'lucide-react';

const UnifiedNavigation = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [userProfile, setUserProfile] = useState({
    name: 'Alex Creator',
    avatar: '/api/placeholder/32/32',
    role: 'Creator',
    notifications: 3
  });

  // Navigation structure
  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      href: '/dashboard',
      description: 'Overview and analytics'
    },
    {
      id: 'creator-bonds',
      label: 'Creator Bonds',
      icon: DollarSign,
      href: '/bonds',
      description: 'Manage your creator bonds',
      children: [
        { label: 'My Bonds', href: '/bonds/my-bonds', icon: TrendingUp },
        { label: 'Create Bond', href: '/bonds/create', icon: Zap },
        { label: 'Browse Bonds', href: '/bonds/browse', icon: Globe },
        { label: 'Analytics', href: '/bonds/analytics', icon: BarChart3 }
      ]
    },
    {
      id: 'ip-tokens',
      label: 'IP Tokens',
      icon: Shield,
      href: '/ip-tokens',
      description: 'Intellectual property management',
      children: [
        { label: 'My IP Tokens', href: '/ip-tokens/my-tokens', icon: Shield },
        { label: 'Create Token', href: '/ip-tokens/create', icon: Zap },
        { label: 'Marketplace', href: '/ip-tokens/marketplace', icon: Globe },
        { label: 'Royalties', href: '/ip-tokens/royalties', icon: DollarSign }
      ]
    },
    {
      id: 'community',
      label: 'Community',
      icon: Users,
      href: '/community',
      description: 'Connect with other creators',
      children: [
        { label: 'Discover Creators', href: '/community/discover', icon: Users },
        { label: 'Events', href: '/community/events', icon: Calendar },
        { label: 'Forums', href: '/community/forums', icon: Users },
        { label: 'Collaborations', href: '/community/collaborations', icon: Users }
      ]
    },
    {
      id: 'wallet',
      label: 'Wallet',
      icon: Wallet,
      href: '/wallet',
      description: 'Manage your digital assets'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/analytics',
      description: 'Performance insights'
    }
  ];

  const quickActions = [
    { label: 'Create Bond', href: '/bonds/create', icon: Zap, color: 'bg-blue-500' },
    { label: 'Mint IP Token', href: '/ip-tokens/create', icon: Shield, color: 'bg-purple-500' },
    { label: 'View Analytics', href: '/analytics', icon: BarChart3, color: 'bg-green-500' }
  ];

  const handleDropdownToggle = (itemId) => {
    setActiveDropdown(activeDropdown === itemId ? null : itemId);
  };

  const handleNavigation = (href, itemId) => {
    setCurrentPage(itemId);
    setActiveDropdown(null);
    setIsMobileMenuOpen(false);
    // In a real app, you'd use your router here
    console.log(`Navigating to: ${href}`);
  };

  return (
    <div className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CB</span>
              </div>
            </div>
            <div className="hidden md:block">
              <h1 className="text-xl font-bold text-gray-900">CreatorBonds</h1>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.id} className="relative">
                  <button
                    onClick={() => hasChildren ? handleDropdownToggle(item.id) : handleNavigation(item.href, item.id)}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                    {hasChildren && (
                      <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${
                        activeDropdown === item.id ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {hasChildren && activeDropdown === item.id && (
                    <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
                        {item.description}
                      </div>
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.href}
                            onClick={() => handleNavigation(child.href, item.id)}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                          >
                            <ChildIcon className="w-4 h-4 mr-3 text-gray-400" />
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="hidden md:block relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>

            {/* Quick Actions - Desktop */}
            <div className="hidden lg:flex items-center space-x-2">
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.href}
                    onClick={() => handleNavigation(action.href, 'quick-action')}
                    className={`${action.color} text-white p-2 rounded-md hover:opacity-90 transition-opacity`}
                    title={action.label}
                  >
                    <ActionIcon className="w-4 h-4" />
                  </button>
                );
              })}
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
              {userProfile.notifications > 0 && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white"></span>
              )}
            </button>

            {/* User Profile */}
            <div className="relative">
              <button
                onClick={() => handleDropdownToggle('profile')}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <img
                  className="h-8 w-8 rounded-full"
                  src="/api/placeholder/32/32"
                  alt={userProfile.name}
                />
                <span className="hidden md:block ml-2 text-gray-700">{userProfile.name}</span>
                <ChevronDown className="hidden md:block w-4 h-4 ml-1 text-gray-400" />
              </button>

              {/* Profile Dropdown */}
              {activeDropdown === 'profile' && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">{userProfile.name}</p>
                    <p className="text-xs text-gray-500">{userProfile.role}</p>
                  </div>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4 mr-3" />
                    Profile
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </button>
                  <button className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                    <HelpCircle className="w-4 h-4 mr-3" />
                    Help
                  </button>
                  <div className="border-t border-gray-100">
                    <button className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Mobile Search */}
            <div className="px-3 py-2">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                />
              </div>
            </div>

            {/* Mobile Navigation Items */}
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              const hasChildren = item.children && item.children.length > 0;

              return (
                <div key={item.id}>
                  <button
                    onClick={() => hasChildren ? handleDropdownToggle(item.id) : handleNavigation(item.href, item.id)}
                    className={`w-full flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive 
                        ? 'bg-blue-100 text-blue-700' 
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                    {hasChildren && (
                      <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${
                        activeDropdown === item.id ? 'rotate-180' : ''
                      }`} />
                    )}
                  </button>

                  {/* Mobile Submenu */}
                  {hasChildren && activeDropdown === item.id && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon;
                        return (
                          <button
                            key={child.href}
                            onClick={() => handleNavigation(child.href, item.id)}
                            className="w-full flex items-center px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-md"
                          >
                            <ChildIcon className="w-4 h-4 mr-3 text-gray-400" />
                            {child.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Mobile Quick Actions */}
            <div className="border-t border-gray-200 pt-3 mt-3">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Actions</p>
              </div>
              {quickActions.map((action) => {
                const ActionIcon = action.icon;
                return (
                  <button
                    key={action.href}
                    onClick={() => handleNavigation(action.href, 'quick-action')}
                    className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <div className={`${action.color} p-1 rounded mr-3`}>
                      <ActionIcon className="w-4 h-4 text-white" />
                    </div>
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close dropdowns */}
      {(activeDropdown || isMobileMenuOpen) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setActiveDropdown(null);
            setIsMobileMenuOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default UnifiedNavigation;