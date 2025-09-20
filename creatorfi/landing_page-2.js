import React, { useState, useEffect } from 'react';
import { TrendingUp, Users, Shield, Zap, Play, Star, ArrowRight, Check, DollarSign, Globe, Heart } from 'lucide-react';

const LandingPage = () => {
  const [activeTab, setActiveTab] = useState('creators');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const creatorBenefits = [
    "Raise capital without giving up creative control",
    "Direct financial relationships with your audience",
    "Automated revenue sharing across all platforms",
    "Professional investor relations & compliance",
    "Growth funding for equipment, team, and projects"
  ];

  const investorBenefits = [
    "Invest in creators you believe in",
    "Share in their success across all revenue streams",
    "Transparent performance tracking and analytics",
    "Fractional ownership starting from just $50",
    "Diversify across the creator economy"
  ];

  const featuredCreators = [
    {
      name: "Alex Rivera",
      category: "Tech Education",
      followers: "281K",
      monthlyRevenue: "$8.5K",
      growth: "+23%",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Maya Chen",
      category: "Indie Gaming",
      followers: "156K",
      monthlyRevenue: "$12K",
      growth: "+45%",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
    },
    {
      name: "Jordan Blake",
      category: "Electronic Music",
      followers: "445K",
      monthlyRevenue: "$15.6K",
      growth: "+67%",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
    }
  ];

  const stats = [
    { label: "Total Raised", value: "$2.4M", icon: DollarSign },
    { label: "Active Creators", value: "1,247", icon: Users },
    { label: "Investors", value: "8,932", icon: TrendingUp },
    { label: "Countries", value: "34", icon: Globe }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                CreatorFi
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-600 hover:text-purple-600 transition-colors">Features</a>
              <a href="#creators" className="text-gray-600 hover:text-purple-600 transition-colors">For Creators</a>
              <a href="#investors" className="text-gray-600 hover:text-purple-600 transition-colors">For Investors</a>
              <a href="#about" className="text-gray-600 hover:text-purple-600 transition-colors">About</a>
            </div>

            <div className="flex items-center space-x-4">
              <button className="text-gray-600 hover:text-purple-600 transition-colors">Login</button>
              <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
                Get Started
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 pb-16 bg-gradient-to-br from-purple-50 via-white to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className={`transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Invest in the 
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"> Future </span>
                of Creativity
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                The first platform where creators can tokenize their work and fans can invest in their success. 
                Democratizing the creator economy, one token at a time.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105 flex items-center justify-center group">
                  Start Creating
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="border-2 border-purple-600 text-purple-600 px-8 py-4 rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center">
                  <Play className="mr-2 w-5 h-5" />
                  Watch Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="flex justify-center mb-2">
                      <stat.icon className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Hero Visual */}
            <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
              <div className="relative">
                <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-gray-900">Featured Creators</h3>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  
                  <div className="space-y-4">
                    {featuredCreators.map((creator, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                        <div className="flex items-center space-x-3">
                          <img 
                            src={creator.avatar} 
                            alt={creator.name}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-100"
                          />
                          <div>
                            <div className="font-medium text-gray-900">{creator.name}</div>
                            <div className="text-sm text-gray-600">{creator.category}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">{creator.monthlyRevenue}</div>
                          <div className="text-sm text-gray-600">{creator.growth}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-3 shadow-lg animate-bounce">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-blue-500 rounded-full p-3 shadow-lg animate-pulse">
                  <Heart className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">How CreatorFi Works</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A seamless platform connecting creators with investors through tokenized creative assets
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">1. Creators Tokenize</h3>
              <p className="text-gray-600">
                Content creators tokenize their work and future revenue streams, 
                setting investment terms and sharing their vision with potential supporters.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">2. Fans Invest</h3>
              <p className="text-gray-600">
                Supporters discover and invest in creators they believe in, 
                purchasing tokens that represent ownership in the creator's success.
              </p>
            </div>

            <div className="text-center group">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">3. Everyone Wins</h3>
              <p className="text-gray-600">
                As creators succeed, token holders automatically receive their share 
                of revenue through smart contract distributions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* For Creators/Investors Tabs */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <div className="inline-flex bg-white rounded-xl p-2 shadow-lg">
              <button
                onClick={() => setActiveTab('creators')}
                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'creators'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                For Creators
              </button>
              <button
                onClick={() => setActiveTab('investors')}
                className={`px-8 py-3 rounded-lg font-medium transition-all ${
                  activeTab === 'investors'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-purple-600'
                }`}
              >
                For Investors
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                {activeTab === 'creators' ? 'Monetize Your Creativity' : 'Invest in What You Love'}
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {activeTab === 'creators' 
                  ? 'Turn your passion into a sustainable business with direct fan investment and automated revenue sharing.'
                  : 'Support creators you believe in and share in their success across all platforms and revenue streams.'
                }
              </p>

              <div className="space-y-4">
                {(activeTab === 'creators' ? creatorBenefits : investorBenefits).map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              <button className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105">
                {activeTab === 'creators' ? 'Start Creating' : 'Start Investing'}
              </button>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
                {activeTab === 'creators' ? (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Creator Dashboard Preview</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-4 bg-green-50 rounded-xl">
                        <span className="text-gray-700">Total Raised</span>
                        <span className="font-bold text-purple-600">$45,000</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-orange-50 rounded-xl">
                        <span className="text-gray-700">Reputation Score</span>
                        <span className="font-bold text-orange-600">785</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Investment Portfolio</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <img 
                            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face"
                            className="w-10 h-10 rounded-full"
                            alt="Creator"
                          />
                          <div>
                            <div className="font-medium">Alex Rivera</div>
                            <div className="text-sm text-gray-600">Tech Education</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">+23%</div>
                          <div className="text-sm text-gray-600">$500 invested</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <img 
                            src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face"
                            className="w-10 h-10 rounded-full"
                            alt="Creator"
                          />
                          <div>
                            <div className="font-medium">Maya Chen</div>
                            <div className="text-sm text-gray-600">Indie Gaming</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">+45%</div>
                          <div className="text-sm text-gray-600">$300 invested</div>
                        </div>
                      </div>
                      <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">$127.50</div>
                          <div className="text-sm text-green-700">Total Returns This Month</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Built for Trust & Security</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Your investments and data are protected by enterprise-grade security and regulatory compliance
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">SEC Compliant</h3>
              <p className="text-gray-600">
                Fully compliant with securities regulations, KYC/AML procedures, and investor protection standards.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Smart Contracts</h3>
              <p className="text-gray-600">
                Automated revenue distribution and transparent ownership tracking through audited blockchain technology.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Governed</h3>
              <p className="text-gray-600">
                Quadratic voting system ensures fair governance with reputation-based decision making.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gradient-to-br from-purple-50 to-pink-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Loved by Creators & Investors</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "CreatorFi transformed my YouTube channel from a hobby into a real business. 
                My supporters now share in my success, and I have the capital to create better content."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face"
                  className="w-12 h-12 rounded-full mr-4"
                  alt="Alex Rivera"
                />
                <div>
                  <div className="font-semibold text-gray-900">Alex Rivera</div>
                  <div className="text-sm text-gray-600">Tech YouTuber</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "I've invested in 5 creators and already seeing returns. It's amazing to support 
                artists I love while building a diversified portfolio in the creator economy."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face"
                  className="w-12 h-12 rounded-full mr-4"
                  alt="Jordan Blake"
                />
                <div>
                  <div className="font-semibold text-gray-900">Sarah Johnson</div>
                  <div className="text-sm text-gray-600">Early Investor</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="flex items-center mb-4">
                {[1,2,3,4,5].map(star => (
                  <Star key={star} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-6">
                "The transparency and automatic revenue sharing is incredible. 
                I can focus on creating while the platform handles all the complex financial stuff."
              </p>
              <div className="flex items-center">
                <img 
                  src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=50&h=50&fit=crop&crop=face"
                  className="w-12 h-12 rounded-full mr-4"
                  alt="Maya Chen"
                />
                <div>
                  <div className="font-semibold text-gray-900">Maya Chen</div>
                  <div className="text-sm text-gray-600">Game Developer</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-pink-600">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Join the Creator Economy Revolution?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Whether you're a creator looking to monetize your passion or an investor 
            seeking new opportunities, CreatorFi is your gateway to the future.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-white text-purple-600 px-8 py-4 rounded-xl hover:bg-gray-100 transition-colors font-semibold">
              Start as Creator
            </button>
            <button className="border-2 border-white text-white px-8 py-4 rounded-xl hover:bg-white hover:text-purple-600 transition-colors font-semibold">
              Start Investing
            </button>
          </div>

          <div className="mt-12 text-purple-100 text-sm">
            Join 10,000+ creators and investors already building the future together
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">CreatorFi</span>
              </div>
              <p className="text-gray-400 mb-4">
                Democratizing the creator economy through tokenized creative assets.
              </p>
              <div className="flex space-x-4">
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold">T</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold">D</span>
                </div>
                <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-gray-700 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold">L</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">For Creators</a></li>
                <li><a href="#" className="hover:text-white transition-colors">For Investors</a></li>
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Press</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © 2025 CreatorFi. All rights reserved.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;Monthly Revenue</span>
                        <span className="font-bold text-green-600">$8,500</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-blue-50 rounded-xl">
                        <span className="text-gray-700">Token Holders</span>
                        <span className="font-bold text-blue-600">342</span>
                      </div>
                      <div className="flex justify-between items-center p-4 bg-purple-50 rounded-xl">
                        <span className="text-gray-700">