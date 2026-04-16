# Backend - Frontend Integration

Run the Flask server (serves the frontend and `/predict` endpoint):

1. Activate your Python environment.

Windows PowerShell:

```
& "venv\Scripts\Activate.ps1"
pip install flask werkzeug librosa tensorflow numpy
python main.py
```

2. Open http://localhost:5000/ to load the frontend UI. Upload an audio file and click "Analyze".

Notes:
- The model is loaded from `backend/cnn_data/taal_cnn_model.keras` by `scripts/predict_cnn.py`.
- If dependencies are already installed in your existing venv, skip reinstall.
