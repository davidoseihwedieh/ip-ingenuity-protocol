import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Users, Eye, Calendar, Filter, Download, Share2, AlertCircle } from 'lucide-react';

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [viewType, setViewType] = useState('creator'); // 'creator' or 'investor'
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  // Sample data - in real app, this would come from API
  const [revenueData, setRevenueData] = useState([
    { date: '2024-01-01', revenue: 4200, tokens: 2800, views: 125000, engagement: 8.5 },
    { date: '2024-01-02', revenue: 4500, tokens: 3000, views: 135000, engagement: 9.2 },
    { date: '2024-01-03', revenue: 3800, tokens: 2600, views: 115000, engagement: 7.8 },
    { date: '2024-01-04', revenue: 5200, tokens: 3400, views: 155000, engagement: 10.1 },
    { date: '2024-01-05', revenue: 6100, tokens: 4000, views: 175000, engagement: 11.3 },
    { date: '2024-01-06', revenue: 5800, tokens: 3800, views: 165000, engagement: 10.8 },
    { date: '2024-01-07', revenue: 6500, tokens: 4200, views: 185000, engagement: 12.0 },
  ]);

  const [platformData, setPlatformData] = useState([
    { platform: 'YouTube', revenue: 3200, percentage: 38, growth: 15.2, color: '#FF0000' },
    { platform: 'TikTok', revenue: 2100, percentage: 25, growth: 28.5, color: '#000000' },
    { platform: 'Instagram', revenue: 1800, percentage: 21, growth: 12.1, color: '#E4405F' },
    { platform: 'Patreon', revenue: 1400, percentage: 16, growth: 8.7, color: '#F96854' },
  ]);

  const [investorData, setInvestorData] = useState([
    { name: 'Alex Rivera', invested: 500, returns: 65, roi: 13, tokens: 12.5, status: 'active' },
    { name: 'Maya Chen', invested: 300, returns: 42, roi: 14, tokens: 8.2, status: 'active' },
    { name: 'Jordan Blake', invested: 750, returns: 95, roi: 12.7, tokens: 18.3, status: 'active' },
    { name: 'Sarah Johnson', invested: 200, returns: 28, roi: 14, tokens: 5.1, status: 'active' },
  ]);

  const [kpiData, setKpiData] = useState({
    totalRevenue: 8500,
    revenueGrowth: 23.5,
    totalInvestors: 342,
    investorGrowth: 18.2,
    avgInvestment: 425,
    investmentGrowth: 12.8,
    tokenPrice: 0.025,
    priceGrowth: 8.9,
    marketCap: 85000,
    capGrowth: 15.4,
    reputationScore: 785,
    reputationChange: 12
  });

  const [predictions, setPredictions] = useState({
    nextMonthRevenue: 9200,
    confidence: 78,
    factors: [
      { factor: 'Seasonal trends', impact: '+12%', positive: true },
      { factor: 'New content series', impact: '+8%', positive: true },
      { factor: 'Platform algorithm changes', impact: '-3%', positive: false },
      { factor: 'Increased competition', impact: '-2%', positive: false }
    ]
  });

  const timeRanges = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ];

  const MetricCard = ({ title, value, change, icon: Icon, positive = true }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <div className={`flex items-center mt-2 text-sm ${positive ? 'text-green-600' : 'text-red-600'}`}>
            {positive ? <TrendingUp className="w-4 h-4 mr-1" /> : <TrendingDown className="w-4 h-4 mr-1" />}
            {change}%
          </div>
        </div>
        <div className={`p-3 rounded-lg ${positive ? 'bg-green-100' : 'bg-red-100'}`}>
          <Icon className={`w-6 h-6 ${positive ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      </div>
    </div>
  );

  const PredictionCard = () => (
    <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 border border-purple-100">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Revenue Prediction</h3>
        <div className="flex items-center text-sm text-gray-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {predictions.confidence}% confidence
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-3xl font-bold text-purple-600 mb-1">
          ${predictions.nextMonthRevenue.toLocaleString()}
        </div>
        <div className="text-sm text-gray-600">Predicted next month revenue</div>
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-900 text-sm">Key Factors:</h4>
        {predictions.factors.map((factor, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-700">{factor.factor}</span>
            <span className={factor.positive ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
              {factor.impact}
            </span>
          </div>
        ))}
      </div>
    </div>
  );

  const TopInvestorsTable = () => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900">Top Investors</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invested</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Returns</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ROI</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tokens</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {investorData.map((investor, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{investor.name}</div>
                </td>
                <td className="px-6 py-4 text-gray-700">${investor.invested}</td>
                <td className="px-6 py-4 text-green-600 font-medium">${investor.returns}</td>
                <td className="px-6 py-4">
                  <span className="text-green-600 font-medium">+{investor.roi}%</span>
                </td>
                <td className="px-6 py-4 text-gray-700">{investor.tokens}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Track your performance and optimize your creator strategy</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-500" />
              <select 
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
            
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            
            <button className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard 
            title="Monthly Revenue" 
            value={`$${kpiData.totalRevenue.toLocaleString()}`}
            change={kpiData.revenueGrowth}
            icon={DollarSign}
          />
          <MetricCard 
            title="Total Investors" 
            value={kpiData.totalInvestors.toLocaleString()}
            change={kpiData.investorGrowth}
            icon={Users}
          />
          <MetricCard 
            title="Token Price" 
            value={`$${kpiData.tokenPrice}`}
            change={kpiData.priceGrowth}
            icon={TrendingUp}
          />
          <MetricCard 
            title="Reputation Score" 
            value={kpiData.reputationScore}
            change={kpiData.reputationChange}
            icon={Eye}
          />
        </div>

        {/* Main Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Trend */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setSelectedMetric('revenue')}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    selectedMetric === 'revenue' ? 'bg-purple-100 text-purple-700' : 'text-gray-600 hover:bg-gray-100'
                