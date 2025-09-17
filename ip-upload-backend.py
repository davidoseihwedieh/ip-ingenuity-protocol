from flask import Flask, request, jsonify, render_template
import hashlib
import time
import json
import os
from datetime import datetime
import uuid
import sqlite3
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Initialize database
def init_db():
    conn = sqlite3.connect('ip_registry.db')
    c = conn.cursor()
    
    # IP Registry table
    c.execute('''CREATE TABLE IF NOT EXISTS ip_assets
                 (id TEXT PRIMARY KEY,
                  hash TEXT UNIQUE,
                  timestamp INTEGER,
                  owner_address TEXT,
                  title TEXT,
                  description TEXT,
                  file_path TEXT,
                  ip_type TEXT,
                  status TEXT DEFAULT 'active')''')
    
    # User tokens table
    c.execute('''CREATE TABLE IF NOT EXISTS user_tokens
                 (address TEXT PRIMARY KEY,
                  balance INTEGER DEFAULT 0,
                  total_earned INTEGER DEFAULT 0,
                  last_updated INTEGER)''')
    
    # Transactions table
    c.execute('''CREATE TABLE IF NOT EXISTS transactions
                 (id TEXT PRIMARY KEY,
                  user_address TEXT,
                  ip_id TEXT,
                  transaction_type TEXT,
                  amount INTEGER,
                  timestamp INTEGER)''')
    
    conn.commit()
    conn.close()

@app.route('/api/upload-ip', methods=['POST'])
def upload_ip():
    try:
        # Get form data
        title = request.form.get('title', '')
        description = request.form.get('description', '')
        ip_type = request.form.get('ip_type', 'patent')
        owner_address = request.form.get('owner_address', '')
        
        # Handle file upload
        file_content = ''
        file_path = None
        
        if 'file' in request.files:
            file = request.files['file']
            if file.filename != '':
                filename = secure_filename(file.filename)
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
                file.save(file_path)
                
                # Read file content for hashing
                with open(file_path, 'rb') as f:
                    file_content = f.read()
        else:
            # Use text content if no file
            file_content = request.form.get('content', '').encode()
        
        if not file_content or not owner_address:
            return jsonify({'error': 'Missing content or owner address'}), 400
        
        # Generate timestamp and hash
        timestamp = int(time.time())
        content_hash = hashlib.sha256(file_content).hexdigest()
        
        # Create unique IP ID
        ip_id = str(uuid.uuid4())
        
        # Store in database
        conn = sqlite3.connect('ip_registry.db')
        c = conn.cursor()
        
        try:
            c.execute('''INSERT INTO ip_assets 
                        (id, hash, timestamp, owner_address, title, description, file_path, ip_type)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)''',
                     (ip_id, content_hash, timestamp, owner_address, title, description, file_path, ip_type))
            
            # Calculate tokens earned (based on content size and type)
            base_tokens = min(len(file_content) // 100, 1000)  # 1 token per 100 bytes, max 1000
            
            type_multipliers = {
                'patent': 3.0,
                'trademark': 2.0,
                'copyright': 1.5,
                'trade_secret': 2.5
            }
            
            tokens_earned = int(base_tokens * type_multipliers.get(ip_type, 1.0))
            
            # Update user tokens
            c.execute('''INSERT OR REPLACE INTO user_tokens 
                        (address, balance, total_earned, last_updated)
                        VALUES (?, 
                               COALESCE((SELECT balance FROM user_tokens WHERE address = ?), 0) + ?,
                               COALESCE((SELECT total_earned FROM user_tokens WHERE address = ?), 0) + ?,
                               ?)''',
                     (owner_address, owner_address, tokens_earned, owner_address, tokens_earned, timestamp))
            
            # Record transaction
            tx_id = str(uuid.uuid4())
            c.execute('''INSERT INTO transactions 
                        (id, user_address, ip_id, transaction_type, amount, timestamp)
                        VALUES (?, ?, ?, ?, ?, ?)''',
                     (tx_id, owner_address, ip_id, 'upload_reward', tokens_earned, timestamp))
            
            conn.commit()
            
            return jsonify({
                'success': True,
                'ip_id': ip_id,
                'timestamp': timestamp,
                'hash': content_hash,
                'tokens_earned': tokens_earned,
                'transaction_id': tx_id
            })
            
        except sqlite3.IntegrityError:
            return jsonify({'error': 'IP with this content already exists'}), 409
            
        finally:
            conn.close()
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/verify-ip/<ip_id>')
def verify_ip(ip_id):
    conn = sqlite3.connect('ip_registry.db')
    c = conn.cursor()
    
    c.execute('''SELECT id, hash, timestamp, owner_address, title, description, ip_type, status
                 FROM ip_assets WHERE id = ?''', (ip_id,))
    
    result = c.fetchone()
    conn.close()
    
    if result:
        return jsonify({
            'id': result[0],
            'hash': result[1],
            'timestamp': result[2],
            'datetime': datetime.fromtimestamp(result[2]).isoformat(),
            'owner': result[3],
            'title': result[4],
            'description': result[5],
            'type': result[6],
            'status': result[7]
        })
    
    return jsonify({'error': 'IP not found'}), 404

@app.route('/api/user-tokens/<address>')
def get_user_tokens(address):
    conn = sqlite3.connect('ip_registry.db')
    c = conn.cursor()
    
    c.execute('''SELECT balance, total_earned FROM user_tokens WHERE address = ?''', (address,))
    result = c.fetchone()
    conn.close()
    
    if result:
        return jsonify({
            'address': address,
            'balance': result[0],
            'total_earned': result[1]
        })
    
    return jsonify({
        'address': address,
        'balance': 0,
        'total_earned': 0
    })

@app.route('/api/user-assets/<address>')
def get_user_assets(address):
    conn = sqlite3.connect('ip_registry.db')
    c = conn.cursor()
    
    c.execute('''SELECT id, title, description, ip_type, timestamp, hash
                 FROM ip_assets WHERE owner_address = ? ORDER BY timestamp DESC''', (address,))
    
    results = c.fetchall()
    conn.close()
    
    assets = []
    for row in results:
        assets.append({
            'id': row[0],
            'title': row[1],
            'description': row[2],
            'type': row[3],
            'timestamp': row[4],
            'datetime': datetime.fromtimestamp(row[4]).isoformat(),
            'hash': row[5]
        })
    
    return jsonify({'assets': assets})

@app.route('/api/stats')
def get_stats():
    conn = sqlite3.connect('ip_registry.db')
    c = conn.cursor()
    
    # Get total IPs
    c.execute('SELECT COUNT(*) FROM ip_assets')
    total_ips = c.fetchone()[0]
    
    # Get total users
    c.execute('SELECT COUNT(*) FROM user_tokens')
    total_users = c.fetchone()[0]
    
    # Get total tokens distributed
    c.execute('SELECT SUM(total_earned) FROM user_tokens')
    result = c.fetchone()
    total_tokens = result[0] if result[0] else 0
    
    conn.close()
    
    return jsonify({
        'total_ips': total_ips,
        'total_users': total_users,
        'total_tokens': total_tokens
    })

@app.route('/api/recent-uploads')
def get_recent_uploads():
    conn = sqlite3.connect('ip_registry.db')
    c = conn.cursor()
    
    c.execute('''SELECT id, title, ip_type, timestamp, owner_address
                 FROM ip_assets ORDER BY timestamp DESC LIMIT 10''')
    
    results = c.fetchall()
    conn.close()
    
    uploads = []
    for row in results:
        uploads.append({
            'id': row[0],
            'title': row[1],
            'type': row[2],
            'timestamp': row[3],
            'datetime': datetime.fromtimestamp(row[3]).isoformat(),
            'owner': row[4][:10] + '...' if len(row[4]) > 10 else row[4]  # Truncate address
        })
    
    return jsonify({'uploads': uploads})

if __name__ == '__main__':
    init_db()
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=False)