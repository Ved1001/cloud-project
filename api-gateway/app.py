import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

import os

app = Flask(__name__)
CORS(app)

# Use internal Docker hostname if available
SERVICE_REGISTRY_URL = os.getenv("SERVICE_REGISTRY_URL", "http://localhost:5003/services")

def get_service_url(service_name):
    try:
        response = requests.get(f"{SERVICE_REGISTRY_URL}/{service_name}")
        if response.status_code == 200:
            return response.json().get('url')
    except Exception as e:
        print(f"Error fetching service URL: {e}")
    return None

def verify_token(token):
    auth_service_url = get_service_url('auth')
    if not auth_service_url:
        return None
    try:
        response = requests.get(f"{auth_service_url}/verify", headers={'Authorization': token})
        return response
    except Exception as e:
        return None

@app.route('/auth/<path:path>', methods=['POST', 'GET'])
def auth_proxy(path):
    auth_service_url = get_service_url('auth')
    if not auth_service_url:
        return jsonify({'error': 'Auth service unavailable'}), 503
    
    url = f"{auth_service_url}/{path}"
    try:
        if request.method == 'POST':
            response = requests.post(url, json=request.json)
        else:
            response = requests.get(url, headers=request.headers)
        return (response.content, response.status_code, response.headers.items())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/notes', methods=['GET', 'POST'])
@app.route('/notes/<int:note_id>', methods=['DELETE'])
def notes_proxy(note_id=None):
    # Verify token first
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'error': 'Unauthorized: No token provided'}), 401
    
    auth_resp = verify_token(token)
    if not auth_resp or auth_resp.status_code != 200:
        return jsonify({'error': 'Unauthorized: Invalid token'}), 401
    
    user_id = auth_resp.json().get('userId')
    
    # Get Notes Service URL dynamically
    notes_service_url = get_service_url('notes')
    if not notes_service_url:
        return jsonify({'error': 'Notes service unavailable'}), 503

    if note_id:
        url = f"{notes_service_url}/notes/{note_id}"
    else:
        url = f"{notes_service_url}/notes"
    
    try:
        if request.method == 'GET':
            response = requests.get(url, params={'userId': user_id})
        elif request.method == 'POST':
            data = request.json
            data['userId'] = user_id
            response = requests.post(url, json=data)
        elif request.method == 'DELETE':
            response = requests.delete(url, params={'userId': user_id})
        
        return (response.content, response.status_code, response.headers.items())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
