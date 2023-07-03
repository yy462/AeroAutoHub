const chatArea = document.getElementById("chatArea");
const chatForm = document.getElementById("chatForm");
const userInput = document.getElementById("userInput");

let messages = [
    {
        "role": "system",
        "content": "You are a knowledgeable and helpful assistant.",
    },
];

chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const userMessage = userInput.value.trim();
    if (userMessage) {
        messages.push({
            "role": "user",
            "content": userMessage,
        });
        console.log("message test", messages)
        addMessageToChatArea("User", userMessage);
        userInput.value = "";
        getChatGPTResponse();
    }
});

function addMessageToChatArea(role, content) {
    // console.log("users are: ", role);
    // console.log("contents are", content);
    const messageDiv = document.createElement("div");
    messageDiv.innerText = `${role}: ${content}`;
    chatArea.appendChild(messageDiv);
}

async function getChatGPTResponse() {
    try {
      console.log("messages before send are: ", messages);
      const response = await axios.post('https://mygptfunction.azurewebsites.net/api/MyGPTFunction', { messages }, {
        headers: {
            'x-functions-key': process.env.OPENAI_KEY
        }
      });
      console.log("response is: ", response)
      // console.log("response data is: ", response.data)
      const jsonResponse = response.data;
      console.log("ChatGPT response is:", jsonResponse);
      messages.push({
        "role": "assistant",
        "content": jsonResponse,
      });
      // addMessageToChatArea("ChatGPT", jsonResponse.response);
      addMessageToChatArea("ChatGPT", jsonResponse);
    } catch (error) {
      console.error("Error fetching ChatGPT response:", error);
    }
}