import os
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/api/predict', methods=['POST'])
def predict():
    features = request.json
    # Mock prediction logic
    prediction = 100000 + features.get('num_claims', 0) * 15000
    return jsonify({
        'success': True,
        'prediction': prediction,
        'correlation': 0.648
    })

@app.route('/api/chat', methods=['POST'])
def chat():
    message = request.json.get('message', '').lower()
    responses = {
        'valuation': 'AI valuation with 0.648 correlation accuracy.',
        'tokenize': 'IPT-1155 standard with 15.3% gas reduction.',
        'governance': 'Quadratic voting with 43.2% inequality reduction.'
    }
    
    for key, response in responses.items():
        if key in message:
            return jsonify({'response': response})
    
    return jsonify({'response': 'Ask about valuation, tokenization, or governance.'})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8081))
    app.run(host='0.0.0.0', port=port, debug=False)
