from flask import Flask, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

import os

# In-memory service repository
# Use environment variables for Docker hostnames, fallback to localhost
SERVICES = {
    "auth": os.getenv("AUTH_SERVICE_URL", "http://localhost:5001"),
    "notes": os.getenv("NOTES_SERVICE_URL", "http://localhost:5002")
}

@app.route('/services', methods=['GET'])
def get_all_services():
    return jsonify(SERVICES)

@app.route('/services/<name>', methods=['GET'])
def get_service(name):
    url = SERVICES.get(name)
    if url:
        return jsonify({"name": name, "url": url})
    return jsonify({"error": "Service not found"}), 404

if __name__ == '__main__':
    print("Service Registry running on port 5003...")
    app.run(host='0.0.0.0', port=5003, debug=True)
