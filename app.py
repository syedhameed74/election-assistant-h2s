import os
from flask import Flask, render_template, request, jsonify
from google import genai
from google.genai import types

app = Flask(__name__)

API_KEY = os.environ.get("GEMINI_API_KEY")

if not API_KEY:
    print("CRITICAL ERROR: GEMINI_API_KEY environment variable is not set.")
    exit(1)

client = genai.Client(api_key=API_KEY)

SYSTEM_INSTRUCTION = """
You are CivicGuide, a premium, articulate, and highly conversational election education assistant, integrated directly into a Material Design knowledge portal.
Your communication style is warm, human, non-partisan, and authoritative yet easy to follow.

Rules for interactions:
1.  Structure responses: Use clear paragraphs, numbered lists, or bolding (`**text**`) for steps. Do NOT dump a wall of text.
2.  Context awareness: Check the history provided with each message to understand past user context and provide continuous, logical answers.
3.  Human Tone: Sound like an expert advisor, not a sterile robotic response. Acknowledge user questions before providing facts.
4.  Local vs. General: Local deadlines vary drastically. For specific dates, instruct users to verify with their official state/local election websites.
"""

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get("message")
    history = data.get("history", [])

    if not user_message:
        return jsonify({"error": "No user message provided"}), 400

    formatted_history = []
    for msg in history:
        if "role" in msg and "parts" in msg:
            formatted_history.append(
                types.Content(
                    role=msg["role"],
                    parts=[types.Part.from_text(text=msg["parts"])]
                )
            )

    try:
        chat_session = client.chats.create(
            model="gemini-2.5-flash",
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_INSTRUCTION,
            ),
            history=formatted_history
        )
        response = chat_session.send_message(user_message)
        
        return jsonify({"response": response.text})
    
    except Exception as e:
        print(f"Internal API Error: {e}")
        return jsonify({"error": "Service temporarily unavailable. Our developers are looking into it."}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)