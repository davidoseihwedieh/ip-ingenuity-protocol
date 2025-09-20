import React, { useState, useEffect } from 'react';
import { Calendar, CreditCard, Users, TrendingUp, Pause, Play, X, Settings } from 'lucide-react';

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([
    {
      id: 1,
      creatorName: "Alex Rivera",
      creatorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      plan: "Fan Token",
      amount: 25,
      interval: "monthly",
      status: "active",
      nextPayment: "2025-02-15",
      totalPaid: 150,
      tokensEarned: 12.5,
      benefits: ["Exclusive content", "Monthly live Q&A", "Discord access", "Early video access"],
      joinedDate: "2024-08-15"
    },
    {
      id: 2,
      creatorName: "Maya Chen",
      creatorAvatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face",
      plan: "Creator Supporter",
      amount: 15,
      interval: "monthly",
      status: "active",
      nextPayment: "2025-02-20",
      totalPaid: 90,
      tokensEarned: 8.2,
      benefits: ["Behind-the-scenes content", "Monthly updates", "Comment priority"],
      joinedDate: "2024-10-01"
    },
    {
      id: 3,
      creatorName: "Jordan Blake",
      creatorAvatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      plan: "VIP Fan",
      amount: 50,
      interval: "monthly",
      status: "paused",
      nextPayment: null,
      totalPaid: 200,
      tokensEarned: 22.8,
      benefits: ["Exclusive music releases", "Producer credits", "1-on-1 sessions", "Merchandise"],
      joinedDate: "2024-06-10"
    }
  ]);

  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);

  const totalMonthlySpend = subscriptions
    .filter(sub => sub.status === 'active')
    .reduce((sum, sub) => sum + sub.amount, 0);

  const totalTokensEarned = subscriptions
    .reduce((sum, sub) => sum + sub.tokensEarned, 0);

  const handlePauseSubscription = (id) => {
    setSubscriptions(subs => 
      subs.map(sub => 
        sub.id === id ? { ...sub, status: 'paused', nextPayment: null } : sub
      )
    );
  };

  const handleResumeSubscription = (id) => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    
    setSubscriptions(subs => 
      subs.map(sub => 
        sub.id === id ? { 
          ...sub, 
          status: 'active', 
          nextPayment: nextMonth.toISOString().split('T')[0] 
        } : sub
      )
    );
  };

  const handleCancelSubscription = (id) => {
    setSubscriptions(subs => subs.filter(sub => sub.id !== id));
  };

  const ManageModal = ({ subscription, onClose }) => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold">Manage Subscription</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <img 
            src={subscription.creatorAvatar} 
            alt={subscription.creatorName}
            className="w-16 h-16 rounded-full object-cover"
          />
          <div>
            <h4 className="font-semibold text-lg">{subscription.creatorName}</h4>
            <p className="text-gray-600">{subscription.plan}</p>
            <p className="text-sm text-gray-500">
              Member since {new Date(subscription.joinedDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Current Plan</h5>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">{subscription.plan}</span>
              <span className="font-semibold">${subscription.amount}/{subscription.interval}</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Your Statistics</h5>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Paid</span>
                <div className="font-semibold">${subscription.totalPaid}</div>
              </div>
              <div>
                <span className="text-gray-600">Tokens Earned</span>
                <div className="font-semibold">{subscription.tokensEarned}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">Benefits Included</h5>
            <ul className="space-y-1">
              {subscription.benefits.map((benefit, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-center">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-3">
          {subscription.status === 'active' ? (
            <>
              <button 
                onClick={() => handlePauseSubscription(subscription.id)}
                className="w-full bg-yellow-500 text-white py-3 rounded-lg hover:bg-yellow-600 transition-colors flex items-center justify-center"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause Subscription
              </button>
              <button 
                onClick={() => handleCancelSubscription(subscription.id)}
                className="w-full bg-red-500 text-white py-3 rounded-lg hover:bg-red-600 transition-colors"
              >
                Cancel Subscription
              </button>
            </>
          ) : (
            <button 
              onClick={() => handleResumeSubscription(subscription.id)}
              className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center"
            >
              <Play className="w-4 h-4 mr-2" />
              Resume Subscription
            </button>
          )}
          
          <button className="w-full border border-gray-300 text-gray-700 py-3 rounded-lg hover:bg-gray-50 transition-colors">
            Update Payment Method
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subscriptions</h1>
          <p className="text-gray-600">Manage your creator subscriptions and track your investment portfolio</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Spend</p>
                <p className="text-2xl font-bold text-gray-900">${totalMonthlySpend}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900">{totalTokensEarned.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Subs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {subscriptions.filter(sub => sub.status === 'active').length}
                </p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-900">Your Subscriptions</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {subscriptions.map((subscription) => (
              <div key={subscription.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <img 
                        src={subscription.creatorAvatar} 
                        alt={subscription.creatorName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                        subscription.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 text-lg">{subscription.creatorName}</h3>
                      <p className="text-gray-600">{subscription.plan}</p>
                      <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                        <span>${subscription.amount}/{subscription.interval}</span>
                        <span>•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.status === 'active' 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {subscription.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Tokens Earned</div>
                      <div className="font-semibold text-lg">{subscription.tokensEarned}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-gray-600">Next Payment</div>
                      <div className="font-semibold">
                        {subscription.nextPayment 
                          ? new Date(subscription.nextPayment).toLocaleDateString()
                          : 'Paused'
                        }
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedSubscription(subscription);
                        setShowManageModal(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <Settings className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Progress bar for token accumulation */}
                <div className="mt-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Token Progress This Month</span>
                    <span>{(subscription.tokensEarned % 1 * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${(subscription.tokensEarned % 1) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-colors text-center">
              <div className="text-2xl mb-2">+</div>
              <div className="font-medium text-gray-900">Find New Creators</div>
              <div className="text-sm text-gray-600">Discover creators to support</div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-400 hover:bg-green-50 transition-colors text-center">
              <div className="text-2xl mb-2">💳</div>
              <div className="font-medium text-gray-900">Payment Methods</div>
              <div className="text-sm text-gray-600">Manage your cards</div>
            </button>

            <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-medium text-gray-900">Portfolio Analytics</div>
              <div className="text-sm text-gray-600">Track your returns</div>
            </button>
          </div>
        </div>
      </div>

      {/* Manage Modal */}
      {showManageModal && selectedSubscription && (
        <ManageModal 
          subscription={selectedSubscription}
          onClose={() => {
            setShowManageModal(false);
            setSelectedSubscription(null);
          }}
        />
      )}
    </div>
  );
};

export default SubscriptionManagement;