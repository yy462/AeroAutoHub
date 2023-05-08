import os
import openai
import requests
from flask import Flask, request, jsonify, render_template

app = Flask(__name__)

OPENAI_API_KEY = "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"
# OPENAI_API_URL = "https://api.openai.com/v1/engines/davinci/completions"
OPENAI_API_URL="https://api.openai.com/v1/chat/completions"
openai.api_key = "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"



@app.route("/chat", methods=["POST"])
def chat():

    data = request.get_json()
    # 
    print("messages received are: ", data)
    messages = data.get('messages',[])
    print("messages received are: ", messages[0]["content"][-1])
    if not messages:
        return jsonify({'error': 'No messages provided'}), 400

    messages = messages[0]["content"][-1]
    formatted_messages = [
        {"role": messages["role"], "content": messages["content"]}
    ]
    completion = openai.ChatCompletion.create(
        model = "gpt-3.5-turbo",
        messages = formatted_messages
    )

    response_text = completion.choices[0].message['content']
    print(response_text)

    return jsonify({"response": response_text})

if __name__ == "__main__":
    app.run()


