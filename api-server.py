from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import sys
import os

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import will be handled dynamically

app = Flask(__name__)
CORS(app)

# Initialize AI components (will be loaded dynamically)
valuation_engine = None

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "message": "IP Ingenuity API is running"})

@app.route('/api/valuation', methods=['POST'])
def evaluate_ip():
    try:
        data = request.get_json()
        
        # Default IP data structure
        ip_data = {
            'claims': data.get('claims', []),
            'description': data.get('description', ''),
            'prior_art': data.get('prior_art', []),
            'technical_details': data.get('technical_details', {}),
            'market_data': data.get('market_data', {}),
            'competitors': data.get('competitors', []),
            'industry': data.get('industry', 'software'),
            'technology_area': data.get('technology_area', ''),
            'financial_data': data.get('financial_data', {}),
            'licensing_data': data.get('licensing_data', {}),
            'development_data': data.get('development_data', {}),
            'risk_data': data.get('risk_data', {}),
            'base_valuation': data.get('base_valuation', 1000000)
        }
        
        # Mock valuation for now
        result_data = {
            'valuation': ip_data['base_valuation'] * 0.75,
            'confidence': 78.5,
            'breakdown': {
                'technical': 0.65,
                'market': 0.72,
                'financial': 0.58,
                'weighted_score': 0.65
            }
        }
        
        return jsonify({
            'success': True,
            'valuation': result_data['valuation'],
            'confidence': result_data['confidence'],
            'breakdown': result_data['breakdown'],
            'timestamp': '2024-12-01T12:00:00'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/search', methods=['POST'])
def search_ip():
    try:
        data = request.get_json()
        query = data.get('query', '')
        
        # Mock search results for now
        mock_results = [
            {
                'asset_id': 'patent_001',
                'similarity_score': 0.85,
                'asset_type': 'patent',
                'metadata': {
                    'title': 'AI-Powered Valuation System',
                    'creator': 'John Doe',
                    'creation_date': '2024-01-01'
                }
            },
            {
                'asset_id': 'patent_002',
                'similarity_score': 0.72,
                'asset_type': 'patent',
                'metadata': {
                    'title': 'Blockchain Token Standard',
                    'creator': 'Jane Smith',
                    'creation_date': '2024-02-01'
                }
            }
        ]
        
        return jsonify({
            'success': True,
            'results': mock_results,
            'query': query
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/mint', methods=['POST'])
def mint_ip_token():
    try:
        data = request.get_json()
        
        # Mock token minting
        token_data = {
            'token_id': f"IPT_{len(str(data.get('title', '')))}{hash(data.get('description', '')) % 10000}",
            'creator': data.get('creator', 'Unknown'),
            'title': data.get('title', ''),
            'description': data.get('description', ''),
            'valuation': data.get('valuation', 0),
            'confidence': data.get('confidence', 0),
            'transaction_hash': f"0x{hash(str(data)) % (10**16):016x}",
            'block_number': 12345678,
            'gas_used': 150000
        }
        
        return jsonify({
            'success': True,
            'token': token_data,
            'message': 'IP token minted successfully'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/portfolio', methods=['GET'])
def get_portfolio():
    try:
        # Mock portfolio data
        portfolio = {
            'total_assets': 5,
            'total_value': 2750000,
            'assets': [
                {
                    'token_id': 'IPT_001',
                    'title': 'AI Valuation System',
                    'valuation': 550000,
                    'confidence': 85,
                    'status': 'active'
                },
                {
                    'token_id': 'IPT_002',
                    'title': 'Blockchain Bridge Protocol',
                    'valuation': 750000,
                    'confidence': 78,
                    'status': 'active'
                }
            ]
        }
        
        return jsonify({
            'success': True,
            'portfolio': portfolio
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    print("Starting IP Ingenuity API Server...")
    print("Available endpoints:")
    print("- GET  /api/health")
    print("- POST /api/valuation")
    print("- POST /api/search")
    print("- POST /api/mint")
    print("- GET  /api/portfolio")
    
    app.run(host='0.0.0.0', port=5001, debug=True)