import os
import dspy
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
import asyncio

# Load environment variables (especially OLLAMA_BASE_URL, OLLAMA_MODEL)
load_dotenv()

app = FastAPI()

# --- CORS Configuration ---
# Define the origins allowed to access your backend.
# Adjust 'http://localhost:3000' if your frontend runs on a different port.
origins = [
    "http://localhost:3000", # Default Next.js dev server
    "http://127.0.0.1:3000", # Alternate localhost
    # Add other origins if needed (e.g., your deployed frontend URL)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, # List of allowed origins
    allow_credentials=True, # Allows cookies to be included in requests
    allow_methods=["*"],    # Allows all methods (GET, POST, OPTIONS, etc.)
    allow_headers=["*"],    # Allows all headers
)

# --- DSPy Configuration (Ollama Only) ---
ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
ollama_model = os.getenv("OLLAMA_MODEL", "gemma3:27b") # User specified model

llm = None
if ollama_base_url and ollama_model:
    print(f"Configuring DSPy with Ollama: model={ollama_model} at {ollama_base_url}...")
    try:
        llm = dspy.LM(model="openai/" + ollama_model, api_key="ollama", api_base=ollama_base_url + '/v1') # api_key required but not used by Ollama
        dspy.settings.configure(lm=llm)
        print("DSPy configured with Ollama.")
    except Exception as e:
        print(f"Error configuring DSPy with Ollama: {e}")
        llm = None # Ensure llm is None if config fails
else:
    print("Warning: Ollama settings (OLLAMA_BASE_URL, OLLAMA_MODEL) not found or incomplete. API will likely fail.")


# --- Pydantic Model for Request ---
class ChatRequest(BaseModel):
    message: str
    # Optional: Add conversation history, user ID, etc. later
    # history: list = []

# --- Basic DSPy Signature for QA ---
class BasicQA(dspy.Signature):
    """Answer questions concisely."""
    question = dspy.InputField()
    answer = dspy.OutputField(desc="A concise answer to the question.")

# --- Simple DSPy Predict Module ---
qa_predictor = dspy.Predict(BasicQA)


# --- Streaming Endpoint ---
@app.post("/api/chat/stream")
async def stream_chat(request: ChatRequest):
    """
    Receives a chat message and streams back the DSPy agent's response.
    Uses simulated streaming by generating the full response first.
    """
    print(f"Received message: {request.message}")

    async def event_stream():
        if not dspy.settings.lm:
            yield "Error: LLM not configured. Please check Ollama settings."
            return

        try:
            response = qa_predictor(question=request.message)
            answer = response.answer if hasattr(response, 'answer') else "Error: Could not generate response."

            words = answer.split()
            for i, word in enumerate(words):
                yield word + (" " if i < len(words) - 1 else "") # Add space except for last word
                await asyncio.sleep(0.05) # Small delay between words

        except Exception as e:
            print(f"Error during DSPy generation/stream: {e}")
            yield f"\nError: Could not process the request. Details: {str(e)}"

    return StreamingResponse(event_stream(), media_type="text/plain")


# --- Run the server (for local testing) ---
if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting Uvicorn server on http://{host}:{port}")
    # Use reload=True for development, consider reload=False for production
    uvicorn.run("main:app", host=host, port=port, reload=True)
