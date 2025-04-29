import dspy
import os
from typing import List, Optional
from dotenv import load_dotenv

# Remove tool import
# from tools import MapSummaryTool

# Load environment variables (optional, for API keys/URLs)
load_dotenv()

# --- Agent Definition ---

class MapInteractionSignature(dspy.Signature):
    """Determine the next step: use a tool (zoom, get_map_summary) or provide a final textual answer."""
    chat_history = dspy.InputField(desc="The recent conversation history.")
    user_input = dspy.InputField(desc="The latest message from the user.")
    image_description = dspy.InputField(desc="(Optional) A textual description of the current map view, ONLY provided after a zoom or map summary action.")
    available_tools = dspy.InputField(desc="List of available tools: [zoom, get_map_summary]")
    tool_result = dspy.InputField(desc="(Optional) The result from the last tool execution (e.g., map summary data). If the last action was NOT a tool call, this will be empty.")

    action = dspy.OutputField(desc="One of: [zoom, get_map_summary, final_answer]")
    action_input = dspy.OutputField(
        desc=("If action is 'zoom', provide JSON arguments (e.g., {\"location_name\": \"Paris\", \"zoom_level\": 12}). "
              "If action is 'get_map_summary', provide an empty JSON object ({}). "
              "If action is 'final_answer', provide the final text response."),
        json_schema={'type': 'string'} # Keep as string, parsing happens later
    )

class MapChatAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        # Remove tool initialization
        # self.tools = {
        #     "zoom": None, # Zoom is handled via frontend signal, not a DSPy tool instance
        #     "get_map_summary": MapSummaryTool()
        # }
        # self.tool_names = list(self.tools.keys())

        # Ensure dspy.settings.lm is configured (usually done in main.py)
        if not dspy.settings.lm:
            print("Warning: dspy.settings.lm not configured. Predictor may fail.")
            # Optional: Add fallback configuration if needed, similar to before
            # ... (fallback config logic) ...
        
        # Use Predict for action/input generation
        # We might need a more complex module if we want the LLM to reason *about* the tool result
        # For now, Predict generates the next action based on history/input/tool_result
        self.predictor = dspy.Predict(MapInteractionSignature)

    def forward(self, user_input: str, chat_history: List[str] = [], image_description: Optional[str] = None, tool_result: Optional[dict] = None):
        """Processes input, potentially predicts tool use, or generates final answer."""
        history_str = "\n".join(chat_history)
        tool_result_str = str(tool_result) if tool_result else ""

        # Call the Predict module
        # The available_tools input might be less critical now, but keep for context
        prediction = self.predictor(
            chat_history=history_str,
            user_input=user_input,
            image_description=image_description or "",
            available_tools=str(["zoom", "get_map_summary"]), # Still inform LLM about possible actions
            tool_result=tool_result_str
        )

        return prediction

# Example usage (primarily for basic testing, main interaction via API)
if __name__ == '__main__':
    # Configure LM (replace with your actual setup)
    try:
        turbo = dspy.OpenAI(model='gpt-3.5-turbo-instruct', max_tokens=150)
        dspy.settings.configure(lm=turbo)
        print("DSPy configured with dummy OpenAI.")
    except Exception as e:
        print(f"Dummy OpenAI config failed: {e}. Ensure OPENAI_API_KEY is set or use Ollama config.")
        # Add Ollama fallback if needed
        # ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        # ollama_model = os.getenv("OLLAMA_MODEL", "llama3:latest")
        # llm = dspy.Ollama(model=ollama_model, api_base=ollama_base_url)
        # dspy.settings.configure(lm=llm)
        # print("DSPy configured with Ollama fallback.")

    agent = MapChatAgent()

    print("--- Test 1: Simple Question ---")
    response1 = agent.forward(user_input="What is the capital of France?")
    print(f"Input: What is the capital of France?")
    print(f"Predicted Action: {response1.action}")
    print(f"Predicted Input: {response1.action_input}")

    print("\n--- Test 2: Requesting Zoom ---")
    response2 = agent.forward(user_input="Show me Mount Fuji at zoom 10")
    print(f"Input: Show me Mount Fuji at zoom 10")
    print(f"Predicted Action: {response2.action}")
    print(f"Predicted Input: {response2.action_input}")

    print("\n--- Test 3: Requesting Summary ---")
    response3 = agent.forward(user_input="What do you see on the map?")
    print(f"Input: What do you see on the map?")
    print(f"Predicted Action: {response3.action}")
    print(f"Predicted Input: {response3.action_input}")

    print("\n--- Test 4: Processing Summary Result (Simulated) ---")
    simulated_tool_result = {
        "count": 5,
        "center": {"lng": 138.7, "lat": 35.3},
        "zoom": 10,
        "screenshotDataURL": "data:...",
        "biggestShip": {"MMSI": 123, "Length": 200, "Width": 30},
        "fastestShip": {"MMSI": 456, "SOG": 25},
        "smallestShip": {"MMSI": 789, "Length": 50, "Width": 10}
    }
    # Simulate the agent receiving the tool result and the follow-up prompt/history
    history_after_tool = [
        "User: What do you see on the map?",
        "Agent: [TOOL CALL: get_map_summary]"
    ]
    response4 = agent.forward(
        user_input="Okay, tell me about it.", # User might just say okay, or ask specific q
        chat_history=history_after_tool,
        tool_result=simulated_tool_result
    )
    print(f"Input: Okay, tell me about it. (with tool result)")
    print(f"Predicted Action: {response4.action}")
    print(f"Predicted Input: {response4.action_input}")
