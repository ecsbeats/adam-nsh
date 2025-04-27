import os
import dspy
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
import asyncio
import json
from typing import List, Optional

from agent import MapChatAgent

load_dotenv()

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
ollama_model = os.getenv("OLLAMA_MODEL", "gemma3:27b")

llm = None
agent = None

if ollama_base_url and ollama_model:
    print(f"Configuring DSPy with Ollama: model={ollama_model} at {ollama_base_url}...")
    try:
        llm = dspy.LM(model="openai/" + ollama_model, api_key="ollama", api_base=ollama_base_url + '/v1')
        dspy.settings.configure(lm=llm)
        print("DSPy configured with Ollama.")
        agent = MapChatAgent()
        print("MapChatAgent initialized.")
    except Exception as e:
        print(f"Error configuring DSPy/Agent: {e}")
        llm = None
        agent = None
else:
    print("Warning: Ollama settings (OLLAMA_BASE_URL, OLLAMA_MODEL) not found or incomplete. API will likely fail.")

# Define the structure for a single message in the history
class HistoryMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    # Update history to use the new model
    history: List[HistoryMessage] = [] 
    image_description: Optional[str] = None

@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    print(f"Received message: {request.message}, History: {len(request.history)} items, Image Desc: {'Yes' if request.image_description else 'No'}")

    async def event_stream():
        delimiter = "\n"

        if not agent:
            error_payload = json.dumps({"type": "error", "content": "Agent not configured. Check server logs."}) + delimiter
            yield error_payload
            return

        try:
            prediction = agent.forward(
                user_input=request.message,
                chat_history=[msg.content for msg in request.history],
                image_description=request.image_description
            )

            action = getattr(prediction, 'action', None)
            action_input_str = getattr(prediction, 'action_input', None)
            
            print(f"Agent raw prediction: Action='{action}', Input='{action_input_str}'")

            if action == 'zoom' and action_input_str:
                try:
                    tool_args = json.loads(action_input_str)
                    payload = {
                        "type": "tool_call",
                        "tool_name": "zoom",
                        "args": tool_args
                    }
                    yield json.dumps(payload) + delimiter
                    print(f"Yielded Tool Call: {payload}")
                except json.JSONDecodeError as json_e:
                    print(f"Error parsing tool arguments JSON: {json_e}, Input: {action_input_str}")
                    error_payload = json.dumps({"type": "error", "content": f"Agent returned invalid tool arguments: {action_input_str}"}) + delimiter
                    yield error_payload
                except Exception as tool_e:
                    print(f"Error processing tool action: {tool_e}")
                    error_payload = json.dumps({"type": "error", "content": f"Error processing tool action: {str(tool_e)}"}) + delimiter
                    yield error_payload

            elif action == 'final_answer' and action_input_str:
                answer_text = action_input_str
                words = answer_text.split()
                if not words:
                    payload = {"type": "text", "content": ""}
                    yield json.dumps(payload) + delimiter
                    
                for i, word in enumerate(words):
                    content = word + (" " if i < len(words) - 1 else "")
                    payload = {"type": "text", "content": content}
                    yield json.dumps(payload) + delimiter
                    await asyncio.sleep(0.05)
                print(f"Yielded Final Answer: {answer_text}")

            elif hasattr(prediction, 'answer'):
                 answer_text = prediction.answer
                 print(f"Agent gave direct answer (fallback): {answer_text}")
                 words = answer_text.split()
                 if not words:
                     payload = {"type": "text", "content": ""}
                     yield json.dumps(payload) + delimiter
                 for i, word in enumerate(words):
                     content = word + (" " if i < len(words) - 1 else "")
                     payload = {"type": "text", "content": content}
                     yield json.dumps(payload) + delimiter
                     await asyncio.sleep(0.05)

            else:
                 print(f"Warning: Agent prediction structure unexpected: {prediction}")
                 unknown_response = str(prediction)
                 words = unknown_response.split()
                 if not words:
                     payload = {"type": "text", "content": ""}
                     yield json.dumps(payload) + delimiter
                 for i, word in enumerate(words):
                     content = word + (" " if i < len(words) - 1 else "")
                     payload = {"type": "text", "content": content}
                     yield json.dumps(payload) + delimiter
                     await asyncio.sleep(0.05)

        except Exception as e:
            print(f"Error during agent execution/stream: {e}")
            import traceback
            traceback.print_exc()
            error_payload = json.dumps({"type": "error", "content": f"Error processing request: {str(e)}"}) + delimiter
            yield error_payload

    return StreamingResponse(event_stream(), media_type="application/x-ndjson")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting Uvicorn server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
