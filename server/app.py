from flask import Flask, request, jsonify, session, redirect, url_for
from flask_cors import CORS
from authlib.integrations.flask_client import OAuth
import os
import boto3
from botocore.exceptions import ClientError
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import uuid
from datetime import datetime, timedelta
import jwt
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
CORS(app, supports_credentials=True)

# OAuth Configuration
oauth = OAuth(app)

# Google OAuth
google = oauth.register(
    name='google',
    client_id=os.environ.get('GOOGLE_CLIENT_ID'),
    client_secret=os.environ.get('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid_configuration',
    client_kwargs={'scope': 'openid email profile'}
)

# Facebook OAuth
facebook = oauth.register(
    name='facebook',
    client_id=os.environ.get('FACEBOOK_CLIENT_ID'),
    client_secret=os.environ.get('FACEBOOK_CLIENT_SECRET'),
    access_token_url='https://graph.facebook.com/oauth/access_token',
    authorize_url='https://www.facebook.com/dialog/oauth',
    api_base_url='https://graph.facebook.com/',
    client_kwargs={'scope': 'email'}
)

# Apple OAuth
apple = oauth.register(
    name='apple',
    client_id=os.environ.get('APPLE_CLIENT_ID'),
    client_secret=os.environ.get('APPLE_CLIENT_SECRET'),
    authorize_url='https://appleid.apple.com/auth/authorize',
    access_token_url='https://appleid.apple.com/auth/token',
    client_kwargs={'scope': 'name email'}
)

# Database Configuration
DATABASE_URL = os.environ.get('DATABASE_URL', 'postgresql://localhost/ip_ingenuity')

# AWS S3 Configuration
s3_client = boto3.client(
    's3',
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    region_name=os.environ.get('AWS_REGION', 'us-east-1')
)
S3_BUCKET = os.environ.get('S3_BUCKET_NAME', 'ip-ingenuity-files')

def get_db_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)

def init_database():
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Users table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            name VARCHAR(255) NOT NULL,
            provider VARCHAR(50) NOT NULL,
            provider_id VARCHAR(255) NOT NULL,
            avatar_url TEXT,
            wallet_address VARCHAR(42),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # IP Assets table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS ip_assets (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            legal_status VARCHAR(50),
            file_urls TEXT[],
            content_hash VARCHAR(64),
            ai_valuation JSONB,
            tier VARCHAR(20),
            tokens_earned INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Token Campaigns table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS token_campaigns (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            ip_asset_id INTEGER REFERENCES ip_assets(id),
            name VARCHAR(255) NOT NULL,
            total_supply BIGINT NOT NULL,
            token_price DECIMAL(18,8) NOT NULL,
            funding_target DECIMAL(18,8) NOT NULL,
            funds_raised DECIMAL(18,8) DEFAULT 0,
            royalty_percent INTEGER NOT NULL,
            deadline TIMESTAMP NOT NULL,
            active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Milestones table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS milestones (
            id SERIAL PRIMARY KEY,
            campaign_id INTEGER REFERENCES token_campaigns(id),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            funding_required DECIMAL(18,8) NOT NULL,
            deadline_days INTEGER NOT NULL,
            completed BOOLEAN DEFAULT FALSE,
            completed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Investments table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS investments (
            id SERIAL PRIMARY KEY,
            campaign_id INTEGER REFERENCES token_campaigns(id),
            investor_id INTEGER REFERENCES users(id),
            token_amount BIGINT NOT NULL,
            eth_amount DECIMAL(18,8) NOT NULL,
            transaction_hash VARCHAR(66),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    cur.close()
    conn.close()

# Authentication Routes
@app.route('/auth/<provider>')
def oauth_login(provider):
    if provider == 'google':
        redirect_uri = url_for('oauth_callback', provider='google', _external=True)
        return google.authorize_redirect(redirect_uri)
    elif provider == 'facebook':
        redirect_uri = url_for('oauth_callback', provider='facebook', _external=True)
        return facebook.authorize_redirect(redirect_uri)
    elif provider == 'apple':
        redirect_uri = url_for('oauth_callback', provider='apple', _external=True)
        return apple.authorize_redirect(redirect_uri)
    else:
        return jsonify({'error': 'Unsupported provider'}), 400

@app.route('/auth/<provider>/callback')
def oauth_callback(provider):
    try:
        if provider == 'google':
            token = google.authorize_access_token()
            user_info = token.get('userinfo')
            email = user_info['email']
            name = user_info['name']
            avatar_url = user_info.get('picture')
            provider_id = user_info['sub']
            
        elif provider == 'facebook':
            token = facebook.authorize_access_token()
            resp = facebook.get('me?fields=id,email,name,picture')
            user_info = resp.json()
            email = user_info['email']
            name = user_info['name']
            avatar_url = user_info['picture']['data']['url']
            provider_id = user_info['id']
            
        elif provider == 'apple':
            token = apple.authorize_access_token()
            # Apple ID token contains user info
            user_info = jwt.decode(token['id_token'], options={"verify_signature": False})
            email = user_info['email']
            name = user_info.get('name', email.split('@')[0])
            avatar_url = None
            provider_id = user_info['sub']
        
        # Create or update user
        user_id = create_or_update_user(email, name, provider, provider_id, avatar_url)
        
        # Create session
        session['user_id'] = user_id
        session['email'] = email
        session['name'] = name
        
        return redirect('/?auth=success')
        
    except Exception as e:
        return redirect('/?auth=error')

def create_or_update_user(email, name, provider, provider_id, avatar_url):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Check if user exists
    cur.execute('SELECT id FROM users WHERE email = %s', (email,))
    user = cur.fetchone()
    
    if user:
        # Update existing user
        cur.execute('''
            UPDATE users SET name = %s, avatar_url = %s, last_login = CURRENT_TIMESTAMP
            WHERE email = %s RETURNING id
        ''', (name, avatar_url, email))
        user_id = cur.fetchone()['id']
    else:
        # Create new user
        cur.execute('''
            INSERT INTO users (email, name, provider, provider_id, avatar_url)
            VALUES (%s, %s, %s, %s, %s) RETURNING id
        ''', (email, name, provider, provider_id, avatar_url))
        user_id = cur.fetchone()['id']
    
    conn.commit()
    cur.close()
    conn.close()
    return user_id

# File Upload to S3
def upload_file_to_s3(file, filename):
    try:
        s3_client.upload_fileobj(
            file,
            S3_BUCKET,
            filename,
            ExtraArgs={'ACL': 'public-read'}
        )
        return f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"
    except ClientError as e:
        return None

# API Routes
@app.route('/api/user')
def get_user():
    if 'user_id' not in session:
        return jsonify({'authenticated': False}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('SELECT * FROM users WHERE id = %s', (session['user_id'],))
    user = cur.fetchone()
    cur.close()
    conn.close()
    
    return jsonify({
        'authenticated': True,
        'user': dict(user)
    })

@app.route('/api/upload_ip', methods=['POST'])
def upload_ip():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.form
    files = request.files.getlist('files')
    
    # Upload files to S3
    file_urls = []
    for file in files:
        if file.filename:
            filename = f"{uuid.uuid4()}_{secure_filename(file.filename)}"
            url = upload_file_to_s3(file, filename)
            if url:
                file_urls.append(url)
    
    # Generate content hash
    content = f"{data['title']}{data['description']}{datetime.now().isoformat()}"
    content_hash = hashlib.sha256(content.encode()).hexdigest()
    
    # AI Valuation (simplified)
    tier, tokens, valuation = calculate_ai_valuation(
        data['legal_status'], 
        data['category'], 
        data['description']
    )
    
    # Store IP asset
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute('''
        INSERT INTO ip_assets 
        (user_id, title, description, category, legal_status, file_urls, content_hash, ai_valuation, tier, tokens_earned)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    ''', (
        session['user_id'], data['title'], data['description'], 
        data['category'], data['legal_status'], file_urls, 
        content_hash, valuation, tier, tokens
    ))
    
    asset_id = cur.fetchone()['id']
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'success': True,
        'asset_id': asset_id,
        'tier': tier,
        'tokens_earned': tokens,
        'valuation': valuation,
        'content_hash': content_hash
    })

def calculate_ai_valuation(legal_status, category, description):
    # Simplified AI valuation based on patent data
    base_values = {
        'idea': {'min': 500, 'max': 5000, 'tokens': 100},
        'pending': {'min': 5000, 'max': 50000, 'tokens': 400},
        'approved': {'min': 50000, 'max': 500000, 'tokens': 1500},
        'trademark': {'min': 2000, 'max': 25000, 'tokens': 250},
        'copyright': {'min': 1000, 'max': 15000, 'tokens': 150}
    }
    
    category_multipliers = {
        'ai-ml': 1.5, 'biotech': 1.8, 'fintech': 1.3,
        'software': 1.2, 'hardware': 1.4, 'other': 1.0
    }
    
    base = base_values.get(legal_status, base_values['idea'])
    multiplier = category_multipliers.get(category, 1.0)
    
    min_val = int(base['min'] * multiplier)
    max_val = int(base['max'] * multiplier)
    tokens = int(base['tokens'] * multiplier)
    
    tier_map = {'idea': 'Basic', 'pending': 'Standard', 'approved': 'Premium', 
                'trademark': 'Standard', 'copyright': 'Standard'}
    
    return tier_map.get(legal_status, 'Basic'), tokens, {
        'min_value': min_val,
        'max_value': max_val,
        'confidence': 0.85,
        'factors': ['legal_protection', 'market_category', 'description_quality']
    }

@app.route('/api/create_campaign', methods=['POST'])
def create_campaign():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    data = request.json
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Create campaign
    deadline = datetime.now() + timedelta(days=data['duration'])
    cur.execute('''
        INSERT INTO token_campaigns 
        (user_id, ip_asset_id, name, total_supply, token_price, funding_target, royalty_percent, deadline)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        RETURNING id
    ''', (
        session['user_id'], data.get('ip_asset_id'), data['name'],
        data['total_supply'], data['token_price'], data['funding_target'],
        data['royalty_percent'], deadline
    ))
    
    campaign_id = cur.fetchone()['id']
    
    # Create milestones
    for milestone in data.get('milestones', []):
        cur.execute('''
            INSERT INTO milestones (campaign_id, title, description, funding_required, deadline_days)
            VALUES (%s, %s, %s, %s, %s)
        ''', (
            campaign_id, milestone['title'], milestone['description'],
            milestone['funding'], milestone['deadline']
        ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({'success': True, 'campaign_id': campaign_id})

@app.route('/api/campaigns')
def get_campaigns():
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute('''
        SELECT c.*, u.name as creator_name, 
               COUNT(DISTINCT i.investor_id) as investor_count,
               COALESCE(SUM(i.token_amount), 0) as tokens_sold
        FROM token_campaigns c
        JOIN users u ON c.user_id = u.id
        LEFT JOIN investments i ON c.id = i.campaign_id
        WHERE c.active = TRUE
        GROUP BY c.id, u.name
        ORDER BY c.created_at DESC
    ''')
    
    campaigns = cur.fetchall()
    cur.close()
    conn.close()
    
    return jsonify([dict(campaign) for campaign in campaigns])

@app.route('/api/user_data')
def get_user_data():
    if 'user_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get user's IP assets
    cur.execute('SELECT * FROM ip_assets WHERE user_id = %s', (session['user_id'],))
    assets = cur.fetchall()
    
    # Get user's campaigns
    cur.execute('SELECT * FROM token_campaigns WHERE user_id = %s', (session['user_id'],))
    campaigns = cur.fetchall()
    
    # Get user's investments
    cur.execute('''
        SELECT i.*, c.name as campaign_name
        FROM investments i
        JOIN token_campaigns c ON i.campaign_id = c.id
        WHERE i.investor_id = %s
    ''', (session['user_id'],))
    investments = cur.fetchall()
    
    cur.close()
    conn.close()
    
    return jsonify({
        'assets': [dict(asset) for asset in assets],
        'campaigns': [dict(campaign) for campaign in campaigns],
        'investments': [dict(investment) for investment in investments]
    })

@app.route('/logout')
def logout():
    session.clear()
    return redirect('/')

if __name__ == '__main__':
    init_database()
    port = int(os.environ.get('PORT', 5000))
    app.run(debug=False, host='0.0.0.0', port=port)