import os
import dspy
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import uvicorn
import asyncio
import json
from typing import List, Optional
import numpy as np # Import numpy for inf handling
import pandas as pd # Import pandas for isnull/notnull

from data import load_data_by_geolocation
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

# Define the structure for the geolocation query request
class GeoQueryRequest(BaseModel):
    min_lat: float
    max_lat: float
    min_lon: float
    max_lon: float
    table: Optional[str] = 'ais_data' # Optional table name, defaults to ais_data

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

# --- New Endpoint for Geolocation Data ---
@app.post("/api/data/geo")
async def get_geo_data(request: GeoQueryRequest):
    """
    API endpoint to fetch data from ClickHouse based on geographical coordinates.
    """
    print(f"Received geo query: Lat({request.min_lat}, {request.max_lat}), Lon({request.min_lon}, {request.max_lon}), Table: {request.table}")
    try:
        # Call the data loading function
        df = load_data_by_geolocation(
            min_lat=request.min_lat,
            max_lat=request.max_lat,
            min_lon=request.min_lon,
            max_lon=request.max_lon,
            table=request.table
            # Client is handled internally by load_data_by_geolocation if not passed
        )

        if df.empty:
            # Return 204 No Content if no data found for the criteria
            # Alternatively, return an empty list: return []
            # Raising HTTPException might be too strong if "no data" is a valid outcome
             print("No data found for the specified geolocation.")
             return [] # Return empty list for no data found

        # --- Data Cleaning --- 
        # Replace infinity values with NaN
        df.replace([np.inf, -np.inf], np.nan, inplace=True)
        # Replace NaN values with None (which becomes null in JSON)
        # Important: Operate on a copy if you need the original df elsewhere
        # df = df.where(pd.notnull(df), None) # This converts non-NaNs to objects, slower
        # More efficient: Iterate through columns and fillna if needed
        for col in df.select_dtypes(include=np.number).columns:
             if df[col].isnull().any():
                  # Use fillna which preserves dtype more often
                  df[col] = df[col].fillna(np.nan).astype(object).where(df[col].notnull(), None)
        # Handle potential NaT in datetime columns if necessary
        for col in df.select_dtypes(include=['datetime64[ns]', 'datetime64[ns, UTC]']).columns:
            if df[col].isnull().any():
                # Convert NaT to None before JSON serialization
                df[col] = df[col].astype(object).where(df[col].notnull(), None)
        # ---------------------

        # Convert DataFrame to list of dictionaries (JSON serializable)
        # Using orient='records' is generally correct here
        data = df.to_dict(orient='records')
        print(f"Successfully retrieved and cleaned {len(data)} records.")
        return data

    except Exception as e:
        print(f"Error processing geo data request: {e}")
        import traceback
        traceback.print_exc()
        # Raise an HTTP exception for internal server errors
        raise HTTPException(status_code=500, detail=f"Error fetching data: {str(e)}")


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    print(f"Starting Uvicorn server on http://{host}:{port}")
    uvicorn.run("main:app", host=host, port=port, reload=True)
