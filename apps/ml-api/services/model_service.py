import os
import joblib

class ModelService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.model = None
        self.scaler = None
        self.le = None
        self.metadata = None
        
        # Model loading paths
        model_path = 'model/best_model.pkl'
        scaler_path = 'model/scaler.pkl'
        le_path = 'model/label_encoder.pkl'
        metadata_path = 'model/metadata.pkl'

        if not all(os.path.exists(p) for p in [model_path, scaler_path, le_path, metadata_path]):
            print("Warning: Model artifacts not found. Please run 'python3 utils/train.py' first.")
        else:
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.le = joblib.load(le_path)
            self.metadata = joblib.load(metadata_path)
            print(f"Model loaded: {self.metadata['model_name']}")
