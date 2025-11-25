from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
from config import API_KEY

app = Flask(__name__)
CORS(app)


genai.configure(api_key=API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    mensaje = data.get("mensaje", "")

    if not mensaje:
        return jsonify({"respuesta": "No se recibió ningún mensaje."})

    respuesta = model.generate_content(mensaje).text
    return jsonify({"respuesta": respuesta})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
