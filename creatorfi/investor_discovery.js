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