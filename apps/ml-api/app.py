from flask import Flask, jsonify
from api.routes import api_bp
from services.model_service import ModelService

def create_app():
    app = Flask(__name__)
    
    # Register blueprints
    app.register_blueprint(api_bp)

    # Initialize model service on startup
    with app.app_context():
        ModelService.get_instance()

    # Global error handler
    @app.errorhandler(Exception)
    def handle_exception(e):
        # Log the error internally
        print(f"Internal server error: {e}")
        # Return generic message to avoid leaking stack traces
        return jsonify({"error": "An internal server error occurred."}), 500

    return app

app = create_app()

if __name__ == '__main__':
    # Running on 0.0.0.0 to make it accessible if needed
    app.run(host='0.0.0.0', port=5001, debug=False)
