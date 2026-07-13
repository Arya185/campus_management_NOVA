from flask import Blueprint, request, jsonify
import pandas as pd
from services.model_service import ModelService
from utils.explainability import get_explanation

api_bp = Blueprint('api', __name__)

@api_bp.route('/predict', methods=['POST'])
def predict():
    ms = ModelService.get_instance()
    if ms.model is None:
        return jsonify({"error": "Model not loaded. Ensure training is complete."}), 500

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON payload provided."}), 400
        
    required_features = ms.metadata['features']
    
    # Validate input
    for feature in required_features:
        if feature not in data:
            return jsonify({"error": f"Missing required feature: {feature}"}), 400

    # Prepare input for prediction
    # Using pandas DataFrame safely with a single row
    input_df = pd.DataFrame([data])[required_features]
    
    # Scale the input
    input_scaled = ms.scaler.transform(input_df)
    
    # Predict
    prediction_encoded = ms.model.predict(input_scaled)[0]
    prediction_label = ms.le.inverse_transform([prediction_encoded])[0]
    
    # Get confidence
    confidence_str = "N/A"
    if hasattr(ms.model, 'predict_proba'):
        probabilities = ms.model.predict_proba(input_scaled)[0]
        confidence_val = max(probabilities) * 100
        confidence_str = f"{int(confidence_val)}%"
    
    # Generate explanation
    reason_list = get_explanation(data, prediction_label)
    
    return jsonify({
        "prediction": prediction_label,
        "confidence": confidence_str,
        "reason": reason_list
    })
