import dspy
import os
from typing import List, Optional
from dotenv import load_dotenv

# Load environment variables (optional, for API keys/URLs)
load_dotenv()

# --- Agent Definition ---

class MapInteractionSignature(dspy.Signature):
    """Determine the next step: decide to use the zoom tool based on the latest user message and map state (if provided), or provide a final textual answer."""
    chat_history = dspy.InputField(desc="The recent conversation history.")
    user_input = dspy.InputField(desc="The latest message from the user.")
    image_description = dspy.InputField(desc="(Optional) A description of the current map view, provided after a zoom action.")

    action = dspy.OutputField(desc="Either 'zoom' to use the zoom tool or 'final_answer' to respond directly.")
    action_input = dspy.OutputField(desc="If action is 'zoom', provide JSON arguments for the tool (e.g., {\"location_name\": \"Paris\", \"zoom_level\": \"12\"}). If action is 'final_answer', provide the text response.", json_schema={'type': 'string'})

class  MapChatAgent(dspy.Module):
    def __init__(self):
        super().__init__()
        # Ensure dspy.settings.lm is configured (usually done in main.py)
        if not dspy.settings.lm:
            print("Warning: dspy.settings.lm not configured. Predictor may fail.")
            # Optional: Add fallback configuration if needed, similar to before
            # ... (fallback config logic) ...
        
        # Use Predict instead of ReAct. It directly generates the action/input.
        self.predictor = dspy.Predict(MapInteractionSignature)

    def forward(self, user_input: str, chat_history: List[str] = [], image_description: Optional[str] = None):
        """Processes user input and decides on the next action (zoom or answer)."""
        history_str = "\n".join(chat_history)

        # Call the Predict module
        prediction = self.predictor(
            chat_history=history_str,
            user_input=user_input,
            image_description=image_description or "" # Ensure not None
        )

        return prediction

# Example usage (primarily for basic testing, main interaction via API)
if __name__ == '__main__':
    # Ensure LM is configured (as done in the __init__)
    agent = MapChatAgent()

    # Simulate interaction (without real tool execution/feedback loop)
    print("--- Test 1: Simple Question ---")
    response1 = agent.forward(user_input="What is the Eiffel Tower?")
    print(f"Input: What is the Eiffel Tower?")
    # Access the final answer (adjust field based on actual ReAct output)
    print(f"Response: {getattr(response1, 'answer', response1)}") # Attempt to get final answer

    print("\n--- Test 2: Requesting Zoom ---")
    response2 = agent.forward(user_input="Zoom into Paris at level 12")
    print(f"Input: Zoom into Paris at level 12")
    # ReAct's output might be complex here. It might have executed the tool (internally) and the final 'answer' reflects that.
    print(f"Response: {getattr(response2, 'answer', response2)}")

    # Example of how history might be passed (won't work fully without API loop)
    # history = ["User: Zoom into Paris at level 12", "Agent: Zoom action requested..."]
    # response3 = agent.forward(user_input="What landmarks do you see?", chat_history=history, image_description="Screenshot shows the Eiffel Tower clearly.")
    # print(f"\n--- Test 3: Follow-up after simulated zoom ---")
    # print(f"Input: What landmarks do you see? (with image desc)")
    # print(f"Response: {getattr(response3, 'answer', response3)}")
