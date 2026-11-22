import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import numpy as np

app = Flask(__name__)
CORS(app)

MODEL_PATH = "logistic_model.pkl"

FEATURES = [
    "age",
    "anaemia",
    "creatinine_phosphokinase",
    "diabetes",
    "ejection_fraction",
    "high_blood_pressure",
    "platelets",
    "serum_creatinine",
    "serum_sodium",
    "sex",
    "smoking",
    "time",
]

try:
    model = joblib.load(MODEL_PATH)
    scaler = joblib.load("scaler.pkl")
except FileNotFoundError:
    model = None

@app.get("/")
def home():
    return jsonify({
        "message": "Heart Failure Prediction API is running",
        "model_loaded": model is not None
    })

@app.post("/predict")
def predict():
    if model is None:
        return jsonify({"error": "Model file not found."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No input data provided"}), 400

    try:
        values = [float(data[feat]) for feat in FEATURES]
        input_array = np.array([values])
        input_scaled = scaler.transform(input_array)
        prediction = int(model.predict(input_scaled)[0])
        probability = float(model.predict_proba(input_scaled)[0][1])

        return jsonify({
            "prediction": prediction,
            "result": "High Risk of Heart Failure" if prediction == 1 else "Low Risk / Normal",
            "probability": round(probability, 4)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)