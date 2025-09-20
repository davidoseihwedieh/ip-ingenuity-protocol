-- Creator Token Platform Database Schema
-- PostgreSQL Database Setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (both creators and investors)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    bio TEXT,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('creator', 'investor')),
    platforms JSONB DEFAULT '[]',
    category VARCHAR(50),
    reputation_score INTEGER DEFAULT 100,
    verified BOOLEAN DEFAULT FALSE,
    kyc_verified BOOLEAN DEFAULT FALSE,
    profile_image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform connections (social media integrations)
CREATE TABLE platform_connections (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    platform_user_id VARCHAR(100) NOT NULL,
    platform_username VARCHAR(100),
    access_token TEXT,
    refresh_token TEXT,
    followers INTEGER DEFAULT 0,
    verified_on_platform BOOLEAN DEFAULT FALSE,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creator_id, platform)
);

-- Revenue streams tracking
CREATE TABLE revenue_streams (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verification_document_url TEXT,
    period_start DATE,
    period_end DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Investments table
CREATE TABLE investments (
    id SERIAL PRIMARY KEY,
    investor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount DECIMAL(15, 2) NOT NULL,
    token_amount DECIMAL(20, 8) NOT NULL,
    purchase_price DECIMAL(10, 6) NOT NULL,
    transaction_hash VARCHAR(66), -- Ethereum transaction hash
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    investment_type VARCHAR(20) DEFAULT 'token' CHECK (investment_type IN ('token', 'subscription', 'fan_token')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue distributions to token holders
CREATE TABLE revenue_distributions (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    total_amount DECIMAL(15, 2) NOT NULL,
    platform_fee DECIMAL(15, 2) NOT NULL,
    distribution_amount DECIMAL(15, 2) NOT NULL,
    per_token_amount DECIMAL(20, 8) NOT NULL,
    total_tokens DECIMAL(20, 8) NOT NULL,
    distribution_hash VARCHAR(66), -- Blockchain transaction hash
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual distribution payments to investors
CREATE TABLE distribution_payments (
    id SERIAL PRIMARY KEY,
    distribution_id INTEGER REFERENCES revenue_distributions(id) ON DELETE CASCADE,
    investor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token_amount DECIMAL(20, 8) NOT NULL,
    payment_amount DECIMAL(15, 2) NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    claim_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    claimed_at TIMESTAMP WITH TIME ZONE
);

-- Voting system for platform governance
CREATE TABLE governance_proposals (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    proposal_type VARCHAR(50) NOT NULL CHECK (proposal_type IN ('platform_fee', 'feature_request', 'creator_verification', 'general')),
    voting_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    voting_end TIMESTAMP WITH TIME ZONE NOT NULL,
    min_reputation INTEGER DEFAULT 100,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'passed', 'rejected', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quadratic voting records
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES governance_proposals(id) ON DELETE CASCADE,
    voter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vote_power INTEGER NOT NULL, -- Number of votes cast
    vote_cost DECIMAL(10, 6) NOT NULL, -- Quadratic cost calculation
    vote_direction BOOLEAN NOT NULL, -- TRUE for yes, FALSE for no
    reputation_at_vote INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(proposal_id, voter_id)
);

-- Reputation tracking and scoring
CREATE TABLE reputation_events (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    points_change INTEGER NOT NULL,
    description TEXT,
    related_entity_type VARCHAR(50), -- 'investment', 'revenue', 'vote', etc.
    related_entity_id INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- KYC/AML compliance records
CREATE TABLE kyc_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'jumio', 'onfido', etc.
    verification_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
    document_type VARCHAR(50),
    country_code VARCHAR(2),
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    verified_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Fan engagement and subscriptions
CREATE TABLE fan_subscriptions (
    id SERIAL PRIMARY KEY,
    fan_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subscription_type VARCHAR(20) DEFAULT 'monthly' CHECK (subscription_type IN ('monthly', 'quarterly', 'yearly')),
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
    next_payment_date DATE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Creator content and exclusive access
CREATE TABLE creator_content (
    id SERIAL PRIMARY KEY,
    creator_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('video', 'audio', 'image', 'text', 'live_stream')),
    content_url TEXT,
    thumbnail_url TEXT,
    access_level VARCHAR(20) DEFAULT 'public' CHECK (access_level IN ('public', 'token_holders', 'subscribers', 'premium')),
    min_tokens_required DECIMAL(20, 8) DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and metrics tracking
CREATE TABLE platform_metrics (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_users INTEGER DEFAULT 0,
    active_creators INTEGER DEFAULT 0,
    active_investors INTEGER DEFAULT 0,
    total_volume DECIMAL(15, 2) DEFAULT 0,
    platform_revenue DECIMAL(15, 2) DEFAULT 0,
    new_registrations INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(metric_date)
);

-- Audit log for compliance
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_users_reputation ON users(reputation_score);
CREATE INDEX idx_creator_profiles_featured ON creator_profiles(featured);
CREATE INDEX idx_platform_connections_creator ON platform_connections(creator_id);
CREATE INDEX idx_revenue_streams_creator_date ON revenue_streams(creator_id, created_at);
CREATE INDEX idx_investments_investor ON investments(investor_id);
CREATE INDEX idx_investments_creator ON investments(creator_id);
CREATE INDEX idx_investments_status ON investments(status);
CREATE INDEX idx_revenue_distributions_creator ON revenue_distributions(creator_id);
CREATE INDEX idx_votes_proposal ON votes(proposal_id);
CREATE INDEX idx_reputation_events_user ON reputation_events(user_id);
CREATE INDEX idx_fan_subscriptions_creator ON fan_subscriptions(creator_id);
CREATE INDEX idx_creator_content_creator ON creator_content(creator_id);
CREATE INDEX idx_creator_content_access ON creator_content(access_level);

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$ language 'plpgsql';

-- Triggers for updated_at columns
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_profiles_updated_at BEFORE UPDATE ON creator_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_platform_connections_updated_at BEFORE UPDATE ON platform_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_revenue_streams_updated_at BEFORE UPDATE ON revenue_streams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data insertion (for development/testing)
INSERT INTO users (email, password, name, bio, user_type, category, reputation_score, verified) VALUES
('alex@example.com', '$2a$12$hash', 'Alex Rivera', 'Tech reviewer making complex topics accessible', 'creator', 'Tech', 785, true),
('maya@example.com', '$2a$12$hash', 'Maya Chen', 'Indie game developer creating narrative experiences', 'creator', 'Gaming', 892, true),
('investor1@example.com', '$2a$12$hash', 'John Smith', 'Early stage investor in creator economy', 'investor', null, 650, true);

-- Views for common queries
CREATE VIEW creator_stats AS
SELECT 
    u.id,
    u.name,
    u.reputation_score,
    cp.total_raised,
    cp.investor_count,
    COALESCE(SUM(rs.amount), 0) as monthly_revenue,
    COUNT(DISTINCT pc.platform) as connected_platforms
FROM users u
LEFT JOIN creator_profiles cp ON u.id = cp.user_id
LEFT JOIN revenue_streams rs ON u.id = rs.creator_id 
    AND rs.created_at > NOW() - INTERVAL '30 days'
LEFT JOIN platform_connections pc ON u.id = pc.creator_id
WHERE u.user_type = 'creator'
GROUP BY u.id, u.name, u.reputation_score, cp.total_raised, cp.investor_count;

CREATE VIEW investor_portfolio AS
SELECT 
    i.investor_id,
    u.name as investor_name,
    c.name as creator_name,
    i.amount as invested_amount,
    i.token_amount,
    i.purchase_price,
    (SELECT SUM(dp.payment_amount) FROM distribution_payments dp 
     WHERE dp.investor_id = i.investor_id AND dp.claimed = true) as total_returns
FROM investments i
JOIN users u ON i.investor_id = u.id
JOIN users c ON i.creator_id = c.id
WHERE i.status = 'confirmed';

-- Function to calculate quadratic voting cost
CREATE OR REPLACE FUNCTION calculate_vote_cost(vote_count INTEGER)
RETURNS DECIMAL(10, 6) AS $
BEGIN
    RETURN vote_count * vote_count * 0.01; -- Quadratic scaling with base cost
END;
$ LANGUAGE plpgsql;

-- Function to update reputation score
CREATE OR REPLACE FUNCTION update_creator_reputation(creator_user_id INTEGER)
RETURNS INTEGER AS $
DECLARE
    revenue_consistency INTEGER;
    investor_satisfaction INTEGER;
    platform_activity INTEGER;
    total_score INTEGER;
BEGIN
    -- Calculate revenue consistency (0-300 points)
    SELECT COUNT(*) INTO revenue_consistency
    FROM revenue_streams
    WHERE creator_id = creator_user_id 
      AND created_at > NOW() - INTERVAL '90 days';
    
    revenue_consistency := LEAST(revenue_consistency * 10, 300);
    
    -- Calculate investor satisfaction (0-400 points)
    SELECT COUNT(*) INTO investor_satisfaction
    FROM investments
    WHERE creator_id = creator_user_id
      AND status = 'confirmed';
    
    investor_satisfaction := LEAST(investor_satisfaction * 5, 400);
    
    -- Calculate platform activity (0-300 points)
    SELECT COUNT(DISTINCT platform) INTO platform_activity
    FROM platform_connections
    WHERE creator_id = creator_user_id;
    
    platform_activity := platform_activity * 50;
    
    -- Base score + calculated bonuses
    total_score := 100 + revenue_consistency + investor_satisfaction + platform_activity;
    
    -- Update user reputation
    UPDATE users SET reputation_score = total_score WHERE id = creator_user_id;
    
    RETURN total_score;
END;
$ LANGUAGE plpgsql; DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator profiles (extended info for creators)
CREATE TABLE creator_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    contract_address VARCHAR(42), -- Ethereum contract address
    token_symbol VARCHAR(10),
    token_name VARCHAR(100),
    total_supply DECIMAL(20, 8) DEFAULT 0,
    current_price DECIMAL(10, 6) DEFAULT 0,
    market_cap DECIMAL(15, 2) DEFAULT 0,
    total_raised DECIMAL(15, 2) DEFAULT 0,
    investor_count INTEGER DEFAULT 0,
    featured BOOLEAN DEFAULT FALSE,
    launch_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE