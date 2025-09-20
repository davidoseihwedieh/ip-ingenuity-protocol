import React, { useState, useEffect } from 'react';
import { Search, Filter, TrendingUp, Users, Star, Play, ExternalLink, Heart } from 'lucide-react';

const InvestorDiscovery = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('trending');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Tech', 'Gaming', 'Music', 'Art', 'Education', 'Lifestyle', 'Business'];

  const [creators, setCreators] = useState([
    {
      id: 1,
      name: "Alex Rivera",
      bio: "Tech reviewer making complex topics accessible",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      category: "Tech",
      followers: { total: 281000, platforms: [{ name: "YouTube", count: "125K" }, { name: "TikTok", count: "89K" }, { name: "Instagram", count: "67K" }] },
      monthlyRevenue: 8500,
      tokenPrice: 0.025,
      reputationScore: 785,
      totalRaised: 45000,
      investors: 342,
      growth: 23,
      verified: true,
      featured: true,
      platforms: ["YouTube", "TikTok", "Instagram", "Patreon"]
    },
    {
      id: 2,
      name: "Maya Chen",
      bio: "Indie game developer creating narrative experiences",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      category: "Gaming",
      followers: { total: 156000, platforms: [{ name: "Twitch", count: "78K" }, { name: "YouTube", count: "45K" }, { name: "Twitter", count: "33K" }] },
      monthlyRevenue: 12000,
      tokenPrice: 0.045,
      reputationScore: 892,
      totalRaised: 78000,
      investors: 156,
      growth: 45,
      verified: true,
      featured: false,
      platforms: ["Twitch", "YouTube", "Twitter", "Patreon"]
    },
    {
      id: 3,
      name: "Jordan Blake",
      bio: "Electronic music producer & live performance artist",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      category: "Music",
      followers: { total: 445000, platforms: [{ name: "Spotify", count: "234K" }, { name: "Instagram", count: "125K" }, { name: "TikTok", count: "86K" }] },
      monthlyRevenue: 15600,
      tokenPrice: 0.078,
      reputationScore: 934,
      totalRaised: 125000,
      investors: 523,
      growth: 67,
      verified: true,
      featured: true,
      platforms: ["Spotify", "Instagram", "TikTok", "Bandcamp"]
    },
    {
      id: 4,
      name: "Dr. Sarah Johnson",
      bio: "Science educator breaking down complex research",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face",
      category: "Education",
      followers: { total: 89000, platforms: [{ name: "YouTube", count: "56K" }, { name: "TikTok", count: "23K" }, { name: "LinkedIn", count: "10K" }] },
      monthlyRevenue: 4200,
      tokenPrice: 0.018,
      reputationScore: 756,
      totalRaised: 23000,
      investors: 178,
      growth: 34,
      verified: true,
      featured: false,
      platforms: ["YouTube", "TikTok", "LinkedIn", "Patreon"]
    },
    {
      id: 5,
      name: "Marcus Thompson",
      bio: "Digital artist creating immersive visual experiences",
      avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671d66?w=150&h=150&fit=crop&crop=face",
      category: "Art",
      followers: { total: 67000, platforms: [{ name: "Instagram", count: "45K" }, { name: "Behance", count: "12K" }, { name: "Twitter", count: "10K" }] },
      monthlyRevenue: 6800,
      tokenPrice: 0.032,
      reputationScore: 698,
      totalRaised: 34000,
      investors: 89,
      growth: 18,
      verified: false,
      featured: false,
      platforms: ["Instagram", "Behance", "Twitter", "Foundation"]
    },
    {
      id: 6,
      name: "Lisa Park",
      bio: "Lifestyle vlogger & wellness advocate",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      category: "Lifestyle",
      followers: { total: 234000, platforms: [{ name: "YouTube", count: "145K" }, { name: "Instagram", count: "67K" }, { name: "TikTok", count: "22K" }] },
      monthlyRevenue: 9200,
      tokenPrice: 0.028,
      reputationScore: 723,
      totalRaised: 56000,
      investors: 267,
      growth: 29,
      verified: true,
      featured: false,
      platforms: ["YouTube", "Instagram", "TikTok", "Patreon"]
    }
  ]);

  const filteredCreators = creators.filter(creator => {
    const matchesSearch = creator.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         creator.bio.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || creator.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedCreators = [...filteredCreators].sort((a, b) => {
    switch (sortBy) {
      case 'trending':
        return b.growth - a.growth;
      case 'reputation':
        return b.reputationScore - a.reputationScore;
      case 'revenue':
        return b.monthlyRevenue - a.monthlyRevenue;
      case 'price_low':
        return a.tokenPrice - b.tokenPrice;
      case 'price_high':
        return b.tokenPrice - a.tokenPrice;
      default:
        return 0;
    }
  });

  const CreatorCard = ({ creator }) => (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 hover:border-purple-200">
      {creator.featured && (
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-center py-2 text-sm font-medium">
          ⭐ Featured Creator
        </div>
      )}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={creator.avatar} 
                alt={creator.name}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-100"
              />
              {creator.verified && (
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-1">
                  <Star className="w-3 h-3 text-white fill-current" />
                </div>
          <button className="text-gray-400 hover:text-red-500 transition-colors">
            <Heart className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Monthly Revenue</span>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">${creator.monthlyRevenue.toLocaleString()}</div>
            <div className="text-xs text-green-600">+{creator.growth}% this month</div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Token Price</span>
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <div className="text-lg font-bold text-gray-900">${creator.tokenPrice} ETH</div>
            <div className="text-xs text-gray-600">Rep: {creator.reputationScore}</div>
          </div>
        </div>

        {/* Platform Icons */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex space-x-2">
            {creator.platforms.slice(0, 4).map((platform, idx) => (
              <span key={idx} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                {platform}
              </span>
            ))}
          </div>
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span>{creator.followers.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Investment Info */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-center text-sm mb-3">
            <span className="text-gray-600">Total Raised:</span>
            <span className="font-semibold">${creator.totalRaised.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm mb-4">
            <span className="text-gray-600">Investors:</span>
            <span className="font-semibold">{creator.investors}</span>
          </div>
          
          <div className="flex space-x-2">
            <button className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium">
              Invest Now
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Discover Creators</h1>
              <p className="text-gray-600 mt-1">Invest in the next generation of content creators</p>
            </div>
            
            {/* Search and Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search creators..."
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="trending">Trending</option>
                    <option value="reputation">Reputation</option>
                    <option value="revenue">Revenue</option>
                    <option value="price_low">Price: Low to High</option>
                    <option value="price_high">Price: High to Low</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Investment Range</label>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500">
                    <option>Any Amount</option>
                    <option>$50 - $500</option>
                    <option>$500 - $2,000</option>
                    <option>$2,000+</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mt-6">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-purple-50 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Featured Section */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Creators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCreators.filter(c => c.featured).map(creator => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </div>

        {/* All Creators */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">All Creators</h2>
            <span className="text-gray-600">{sortedCreators.length} creators found</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sortedCreators.map(creator => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </div>
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <button className="px-8 py-3 border border-purple-600 text-purple-600 rounded-lg hover:bg-purple-50 transition-colors font-medium">
            Load More Creators
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvestorDiscovery;
              )}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{creator.name}</h3>
              <p className="text-gray-600 text-sm mb-1">{creator.bio}</p>
              <span className="inline-block bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full">
                {creator.category}
              </span>
            </div>
          </div>