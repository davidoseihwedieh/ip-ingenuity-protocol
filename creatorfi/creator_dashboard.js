import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Users, DollarSign, Star, Plus, ExternalLink, Eye } from 'lucide-react';

const CreatorDashboard = () => {
  const [creator, setCreator] = useState({
    name: "Alex Rivera",
    bio: "Tech reviewer & educator making complex topics accessible",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    verified: true,
    reputationScore: 785,
    totalRaised: 45000,
    monthlyRevenue: 8500,
    tokenPrice: 0.025,
    totalSupply: 10000,
    holders: 342
  });

  const [revenueData, setRevenueData] = useState([
    { month: 'Jan', revenue: 4200, tokens: 2800 },
    { month: 'Feb', revenue: 5100, tokens: 3400 },
    { month: 'Mar', revenue: 6300, tokens: 4200 },
    { month: 'Apr', revenue: 7800, tokens: 5200 },
    { month: 'May', revenue: 8500, tokens: 5700 },
  ]);

  const [platforms, setPlatforms] = useState([
    { name: 'YouTube', revenue: 3200, percentage: 38, color: '#FF0000', followers: '125K' },
    { name: 'TikTok', revenue: 2100, percentage: 25, color: '#000000', followers: '89K' },
    { name: 'Instagram', revenue: 1800, percentage: 21, color: '#E4405F', followers: '67K' },
    { name: 'Patreon', revenue: 1400, percentage: 16, color: '#F96854', followers: '1.2K' },
  ]);

  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [newRevenue, setNewRevenue] = useState({ platform: '', amount: '', description: '' });

  const handleAddRevenue = () => {
    if (newRevenue.platform && newRevenue.amount) {
      // In real app, this would call smart contract
      console.log('Adding revenue:', newRevenue);
      setNewRevenue({ platform: '', amount: '', description: '' });
      setShowAddRevenue(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img 
                src={creator.avatar} 
                alt={creator.name}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-200"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  {creator.name}
                  {creator.verified && <Star className="w-5 h-5 text-yellow-500 fill-current" />}
                </h1>
                <p className="text-gray-600">{creator.bio}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Reputation Score</div>
                <div className="text-2xl font-bold text-purple-600">{creator.reputationScore}</div>
              </div>
              <button 
                onClick={() => setShowAddRevenue(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Revenue
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Raised</p>
                <p className="text-2xl font-bold text-gray-900">${creator.totalRaised.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${creator.monthlyRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Token Holders</p>
                <p className="text-2xl font-bold text-gray-900">{creator.holders}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Token Price</p>
                <p className="text-2xl font-bold text-gray-900">${creator.tokenPrice} ETH</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-lg">
                <Star className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue & Token Performance</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value, name) => [`$${value}`, name === 'revenue' ? 'Revenue' : 'Token Value']} />
                <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} />
                <Line type="monotone" dataKey="tokens" stroke="#10B981" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Revenue Breakdown */}
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Revenue Distribution</h3>
            <div className="flex items-center justify-center mb-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={platforms}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    dataKey="revenue"
                  >
                    {platforms.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {platforms.map((platform, index) => (
                <div key={index} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: platform.color }}
                    ></div>
                    <span className="font-medium">{platform.name}</span>
                    <span className="text-sm text-gray-500">{platform.followers}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">${platform.revenue}</div>
                    <div className="text-sm text-gray-500">{platform.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Connected Platforms */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Connected Platforms</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {platforms.map((platform, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{platform.name}</h4>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Followers:</span>
                    <span className="font-medium">{platform.followers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">This Month:</span>
                    <span className="font-medium text-green-600">${platform.revenue}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full" 
                      style={{ width: `${platform.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Revenue Modal */}
      {showAddRevenue && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add Revenue Stream</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Platform</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newRevenue.platform}
                  onChange={(e) => setNewRevenue({...newRevenue, platform: e.target.value})}
                >
                  <option value="">Select platform</option>
                  <option value="YouTube">YouTube</option>
                  <option value="TikTok">TikTok</option>
                  <option value="Instagram">Instagram</option>
                  <option value="Patreon">Patreon</option>
                  <option value="Sponsorship">Brand Sponsorship</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
                <input 
                  type="number"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  value={newRevenue.amount}
                  onChange={(e) => setNewRevenue({...newRevenue, amount: e.target.value})}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows="3"
                  value={newRevenue.description}
                  onChange={(e) => setNewRevenue({...newRevenue, description: e.target.value})}
                  placeholder="Brief description of revenue source"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setShowAddRevenue(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddRevenue}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add Revenue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;