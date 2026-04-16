from flask import Flask, render_template, request, jsonify
import os
import sys

# Tell Python to look in the scripts folder for your predict.py
sys.path.append(os.path.join(os.path.dirname(__file__), 'scripts'))
from predict import predict_for_web

app = Flask(__name__)
UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

@app.route('/', methods=['GET'])
def index():
    # Serves the HTML frontend
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'audio_file' not in request.files:
        return jsonify({"error": "No file uploaded"})
    
    file = request.files['audio_file']
    if file.filename == '':
        return jsonify({"error": "No selected file"})

    if file:
        # 1. Save the file locally
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        # 2. Run the AI Model
        results = predict_for_web(filepath)

        # 3. Delete the file to save space (optional, but good practice)
        os.remove(filepath)

        # 4. Send results back to the website
        return jsonify(results)

if __name__ == '__main__':
    # Runs the server on localhost:5000
    app.run(debug=True, port=5000)