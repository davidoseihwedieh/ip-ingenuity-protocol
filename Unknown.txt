// contexts/NavigationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const NavigationContext = createContext();

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
};

export const NavigationProvider = ({ children }) => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [pageTitle, setPageTitle] = useState('Dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [navigationHistory, setNavigationHistory] = useState([]);

  // Page configuration
  const pages = {
    dashboard: {
      title: 'Dashboard',
      breadcrumbs: [{ label: 'Dashboard', href: '/dashboard' }],
      access: ['creator', 'supporter', 'admin']
    },
    'bonds/my-bonds': {
      title: 'My Bonds',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Creator Bonds', href: '/bonds' },
        { label: 'My Bonds', href: '/bonds/my-bonds' }
      ],
      access: ['creator', 'admin']
    },
    'bonds/create': {
      title: 'Create Bond',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Creator Bonds', href: '/bonds' },
        { label: 'Create Bond', href: '/bonds/create' }
      ],
      access: ['creator', 'admin']
    },
    'bonds/browse': {
      title: 'Browse Bonds',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Creator Bonds', href: '/bonds' },
        { label: 'Browse', href: '/bonds/browse' }
      ],
      access: ['creator', 'supporter', 'admin']
    },
    'bonds/analytics': {
      title: 'Bond Analytics',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Creator Bonds', href: '/bonds' },
        { label: 'Analytics', href: '/bonds/analytics' }
      ],
      access: ['creator', 'admin']
    },
    'ip-tokens/my-tokens': {
      title: 'My IP Tokens',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'IP Tokens', href: '/ip-tokens' },
        { label: 'My Tokens', href: '/ip-tokens/my-tokens' }
      ],
      access: ['creator', 'admin']
    },
    'ip-tokens/create': {
      title: 'Create IP Token',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'IP Tokens', href: '/ip-tokens' },
        { label: 'Create Token', href: '/ip-tokens/create' }
      ],
      access: ['creator', 'admin']
    },
    'ip-tokens/marketplace': {
      title: 'IP Token Marketplace',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'IP Tokens', href: '/ip-tokens' },
        { label: 'Marketplace', href: '/ip-tokens/marketplace' }
      ],
      access: ['creator', 'supporter', 'admin']
    },
    'community/discover': {
      title: 'Discover Creators',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Community', href: '/community' },
        { label: 'Discover', href: '/community/discover' }
      ],
      access: ['creator', 'supporter', 'admin']
    },
    wallet: {
      title: 'Wallet',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Wallet', href: '/wallet' }
      ],
      access: ['creator', 'supporter', 'admin']
    },
    analytics: {
      title: 'Analytics',
      breadcrumbs: [
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Analytics', href: '/analytics' }
      ],
      access: ['creator', 'admin']
    }
  };

  const navigate = (href, options = {}) => {
    const { replace = false, state = null } = options;
    
    setIsLoading(true);
    
    // Extract page key from href
    const pageKey = href.replace(/^\//, '');
    const pageConfig = pages[pageKey] || pages[Object.keys(pages).find(key => href.includes(key))];
    
    if (pageConfig) {
      setCurrentPage(pageKey);
      setPageTitle(pageConfig.title);
      setBreadcrumbs(pageConfig.breadcrumbs);
      
      // Update navigation history
      if (!replace) {
        setNavigationHistory(prev => [...prev, { href, timestamp: Date.now(), state }]);
      }
    }
    
    // Simulate loading delay
    setTimeout(() => setIsLoading(false), 300);
    
    // In a real app, you'd trigger your router here
    console.log(`Navigating to: ${href}`, { replace, state });
  };

  const goBack = () => {
    if (navigationHistory.length > 1) {
      const previousPage = navigationHistory[navigationHistory.length - 2];
      navigate(previousPage.href, { replace: true });
      setNavigationHistory(prev => prev.slice(0, -1));
    }
  };

  const canAccess = (pageKey, userRole) => {
    const pageConfig = pages[pageKey];
    return pageConfig ? pageConfig.access.includes(userRole) : false;
  };

  const value = {
    currentPage,
    pageTitle,
    breadcrumbs,
    isLoading,
    navigationHistory,
    navigate,
    goBack,
    canAccess,
    pages
  };

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
};

// =============================================
// hooks/usePageTransition.js
// =============================================

import { useState, useEffect } from 'react';
import { useNavigation } from '../contexts/NavigationContext';

export const usePageTransition = () => {
  const { isLoading } = useNavigation();
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsTransitioning(true);
    } else {
      const timer = setTimeout(() => setIsTransitioning(false), 150);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return { isTransitioning, isLoading };
};

// =============================================
// components/Breadcrumbs.js
// =============================================

import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { useNavigation } from '../contexts/NavigationContext';

export const Breadcrumbs = ({ className = '' }) => {
  const { breadcrumbs, navigate } = useNavigation();

  if (!breadcrumbs || breadcrumbs.length === 0) return null;

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`}>
      <button
        onClick={() => navigate('/dashboard')}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Home className="w-4 h-4" />
      </button>
      
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={crumb.href}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          
          {index === breadcrumbs.length - 1 ? (
            <span className="text-gray-900 font-medium">{crumb.label}</span>
          ) : (
            <button
              onClick={() => navigate(crumb.href)}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

// =============================================
// components/PageTransition.js
// =============================================

import React from 'react';
import { usePageTransition } from '../hooks/usePageTransition';

export const PageTransition = ({ children }) => {
  const { isTransitioning } = usePageTransition();

  return (
    <div className={`transition-opacity duration-150 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
      {children}
    </div>
  );
};

// =============================================
// components/NavigationGuard.js
// =============================================

import React from 'react';
import { useNavigation } from '../contexts/NavigationContext';

export const NavigationGuard = ({ 
  children, 
  requiredRole = 'creator', 
  fallback = null,
  redirectTo = '/dashboard' 
}) => {
  const { canAccess, currentPage, navigate } = useNavigation();
  
  // In a real app, you'd get the user role from your auth context
  const userRole = 'creator'; // This would come from your auth system
  
  const hasAccess = canAccess(currentPage, userRole);
  
  React.useEffect(() => {
    if (!hasAccess && redirectTo) {
      navigate(redirectTo);
    }
  }, [hasAccess, redirectTo, navigate]);
  
  if (!hasAccess) {
    return fallback || (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
          <p className="text-gray-500 mt-1">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }
  
  return children;
};

// =============================================
// components/LoadingSpinner.js
// =============================================

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeClasses[size]} ${className}`} />
  );
};

// =============================================
// utils/navigationHelpers.js
// =============================================

export const navigationHelpers = {
  // Generate navigation URLs
  getBondUrl: (bondId) => `/bonds/${bondId}`,
  getTokenUrl: (tokenId) => `/ip-tokens/${tokenId}`,
  getCreatorUrl: (creatorId) => `/creators/${creatorId}`,
  
  // URL parameter extraction
  extractBondId: (pathname) => {
    const match = pathname.match(/\/bonds\/(\d+)/);
    return match ? match[1] : null;
  },
  
  extractTokenId: (pathname) => {
    const match = pathname.match(/\/ip-tokens\/(\d+)/);
    return match ? match[1] : null;
  },
  
  // Navigation state management
  saveNavigationState: (state) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('navigationState', JSON.stringify(state));
    }
  },
  
  restoreNavigationState: () => {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('navigationState');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  },
  
  // Deep linking support
  createDeepLink: (page, params = {}) => {
    const baseUrl = window.location.origin;
    const queryString = Object.keys(params).length > 0 
      ? '?' + new URLSearchParams(params).toString() 
      : '';
    return `${baseUrl}${page}${queryString}`;
  }
};