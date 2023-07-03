import os
import openai
import requests
from dotenv import load_dotenv
import logging

import azure.functions as func

load_dotenv()
OPENAI_API_URL="https://api.openai.com/v1/chat/completions"
openai.api_key = os.getenv("OPENAI_KEY")

def main(req: func.HttpRequest) -> func.HttpResponse:
    data = req.get_json()
    print("messages received are: ", data)
    messages = data.get('messages',[])
    print("messages received are: ", messages[0]["content"][-1])
    if not messages:
        return func.HttpResponse('No messages provided', status_code=400)

    # messages = messages[0]["content"][-1]
    # formatted_messages = [
    #     {"role": messages["role"], "content": messages["content"]}
    # ]
    formatted_messages = []
    for message in messages:
        formatted_messages.append({
            "role": message["role"], 
            "content": message["content"]
        })

    
    completion = openai.ChatCompletion.create(
        model = "gpt-3.5-turbo",
        messages = formatted_messages
    )

    response_text = completion.choices[0].message['content']
    print(response_text)
    return func.HttpResponse(response_text)
