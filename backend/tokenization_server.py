from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from web3 import Web3
import json
import sqlite3
import hashlib
import time
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Web3 setup (using Ganache for local testing)
w3 = Web3(Web3.HTTPProvider('http://127.0.0.1:8545'))

# Contract ABI and address (will be set after deployment)
CONTRACT_ABI = []  # Will be loaded from compiled contract
CONTRACT_ADDRESS = None

# Database setup
def init_db():
    conn = sqlite3.connect('tokenization.db')
    c = conn.cursor()
    
    c.execute('''CREATE TABLE IF NOT EXISTS ip_assets (
        id INTEGER PRIMARY KEY,
        token_id INTEGER,
        name TEXT,
        description TEXT,
        creator_address TEXT,
        content_hash TEXT,
        total_supply INTEGER,
        token_price REAL,
        funding_target REAL,
        funds_raised REAL,
        deadline TEXT,
        royalty_percent INTEGER,
        active BOOLEAN,
        created_at TIMESTAMP,
        milestones TEXT
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY,
        token_id INTEGER,
        investor_address TEXT,
        amount INTEGER,
        eth_paid REAL,
        timestamp TIMESTAMP
    )''')
    
    c.execute('''CREATE TABLE IF NOT EXISTS milestones (
        id INTEGER PRIMARY KEY,
        token_id INTEGER,
        title TEXT,
        description TEXT,
        funding_required REAL,
        deadline_days INTEGER,
        completed BOOLEAN,
        created_at TIMESTAMP
    )''')
    
    conn.commit()
    conn.close()

@app.route('/')
def index():
    return render_template('tokenization_platform.html')

@app.route('/api/create_asset', methods=['POST'])
def create_asset():
    try:
        data = request.json
        
        # Validate input
        required_fields = ['name', 'description', 'totalSupply', 'tokenPrice', 'fundingTarget', 'royaltyPercent', 'duration']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing field: {field}'}), 400
        
        # Generate content hash
        content = f"{data['name']}{data['description']}{time.time()}"
        content_hash = hashlib.sha256(content.encode()).hexdigest()
        
        # Calculate deadline
        deadline = datetime.now() + timedelta(days=int(data['duration']))
        
        # Store in database
        conn = sqlite3.connect('tokenization.db')
        c = conn.cursor()
        
        # Generate mock token_id for demo
        token_id = int(time.time() * 1000) % 1000000
        
        c.execute('''INSERT INTO ip_assets 
                    (token_id, name, description, creator_address, content_hash, 
                     total_supply, token_price, funding_target, funds_raised, 
                     deadline, royalty_percent, active, created_at, milestones)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (token_id, data['name'], data['description'], 
                  data.get('creatorAddress', '0x1234...'), content_hash,
                  data['totalSupply'], data['tokenPrice'], data['fundingTarget'], 0,
                  deadline.isoformat(), data['royaltyPercent'], True, 
                  datetime.now().isoformat(), json.dumps(data.get('milestones', []))))
        
        # Store milestones
        for milestone in data.get('milestones', []):
            c.execute('''INSERT INTO milestones 
                        (token_id, title, description, funding_required, deadline_days, completed, created_at)
                        VALUES (?, ?, ?, ?, ?, ?, ?)''',
                     (token_id, milestone['title'], milestone['description'],
                      milestone['funding'], milestone['deadline'], False, datetime.now().isoformat()))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'tokenId': token_id,
            'contentHash': content_hash,
            'message': 'IP Asset created successfully'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/invest', methods=['POST'])
def invest():
    try:
        data = request.json
        token_id = data['tokenId']
        amount = int(data['amount'])
        investor_address = data['investorAddress']
        
        conn = sqlite3.connect('tokenization.db')
        c = conn.cursor()
        
        # Get asset details
        c.execute('SELECT * FROM ip_assets WHERE token_id = ?', (token_id,))
        asset = c.fetchone()
        
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        
        token_price = asset[7]  # token_price column
        eth_paid = amount * token_price
        
        # Record investment
        c.execute('''INSERT INTO investments 
                    (token_id, investor_address, amount, eth_paid, timestamp)
                    VALUES (?, ?, ?, ?, ?)''',
                 (token_id, investor_address, amount, eth_paid, datetime.now().isoformat()))
        
        # Update funds raised
        c.execute('UPDATE ip_assets SET funds_raised = funds_raised + ? WHERE token_id = ?',
                 (eth_paid, token_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': f'Investment of {amount} tokens successful',
            'ethPaid': eth_paid
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/asset/<int:token_id>')
def get_asset(token_id):
    try:
        conn = sqlite3.connect('tokenization.db')
        c = conn.cursor()
        
        c.execute('SELECT * FROM ip_assets WHERE token_id = ?', (token_id,))
        asset = c.fetchone()
        
        if not asset:
            return jsonify({'error': 'Asset not found'}), 404
        
        # Get investments
        c.execute('SELECT * FROM investments WHERE token_id = ?', (token_id,))
        investments = c.fetchall()
        
        # Get milestones
        c.execute('SELECT * FROM milestones WHERE token_id = ?', (token_id,))
        milestones = c.fetchall()
        
        conn.close()
        
        # Calculate stats
        total_investors = len(set([inv[2] for inv in investments]))  # unique investors
        tokens_sold = sum([inv[3] for inv in investments])  # total amount invested
        
        asset_data = {
            'tokenId': asset[1],
            'name': asset[2],
            'description': asset[3],
            'creatorAddress': asset[4],
            'totalSupply': asset[6],
            'tokenPrice': asset[7],
            'fundingTarget': asset[8],
            'fundsRaised': asset[9],
            'deadline': asset[10],
            'royaltyPercent': asset[11],
            'active': asset[12],
            'totalInvestors': total_investors,
            'tokensSold': tokens_sold,
            'investments': [{'investor': inv[2], 'amount': inv[3], 'ethPaid': inv[4], 'timestamp': inv[5]} for inv in investments],
            'milestones': [{'title': m[2], 'description': m[3], 'fundingRequired': m[4], 'deadlineDays': m[5], 'completed': m[6]} for m in milestones]
        }
        
        return jsonify(asset_data)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/assets')
def get_all_assets():
    try:
        conn = sqlite3.connect('tokenization.db')
        c = conn.cursor()
        
        c.execute('SELECT * FROM ip_assets WHERE active = 1 ORDER BY created_at DESC')
        assets = c.fetchall()
        
        asset_list = []
        for asset in assets:
            # Get investment stats
            c.execute('SELECT COUNT(DISTINCT investor_address), SUM(amount) FROM investments WHERE token_id = ?', (asset[1],))
            stats = c.fetchone()
            
            asset_list.append({
                'tokenId': asset[1],
                'name': asset[2],
                'description': asset[3],
                'tokenPrice': asset[7],
                'fundingTarget': asset[8],
                'fundsRaised': asset[9],
                'totalInvestors': stats[0] or 0,
                'tokensSold': stats[1] or 0,
                'deadline': asset[10],
                'royaltyPercent': asset[11]
            })
        
        conn.close()
        return jsonify(asset_list)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/user_assets/<address>')
def get_user_assets(address):
    try:
        conn = sqlite3.connect('tokenization.db')
        c = conn.cursor()
        
        # Get created assets
        c.execute('SELECT * FROM ip_assets WHERE creator_address = ?', (address,))
        created_assets = c.fetchall()
        
        # Get invested assets
        c.execute('''SELECT DISTINCT a.* FROM ip_assets a 
                    JOIN investments i ON a.token_id = i.token_id 
                    WHERE i.investor_address = ?''', (address,))
        invested_assets = c.fetchall()
        
        conn.close()
        
        return jsonify({
            'createdAssets': [{'tokenId': a[1], 'name': a[2], 'fundsRaised': a[9], 'fundingTarget': a[8]} for a in created_assets],
            'investedAssets': [{'tokenId': a[1], 'name': a[2], 'tokenPrice': a[7]} for a in invested_assets]
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/complete_milestone', methods=['POST'])
def complete_milestone():
    try:
        data = request.json
        token_id = data['tokenId']
        milestone_title = data['milestoneTitle']
        
        conn = sqlite3.connect('tokenization.db')
        c = conn.cursor()
        
        c.execute('UPDATE milestones SET completed = 1 WHERE token_id = ? AND title = ?',
                 (token_id, milestone_title))
        
        conn.commit()
        conn.close()
        
        return jsonify({'success': True, 'message': 'Milestone completed'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5001)