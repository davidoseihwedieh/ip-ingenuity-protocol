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