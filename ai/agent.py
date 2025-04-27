import dspy
import os
from dotenv import load_dotenv

# Load environment variables (optional, for API keys/URLs)
load_dotenv()

class BasicQA(dspy.Signature):
    """Answer questions with short factoid answers."""

    question = dspy.InputField()
    answer = dspy.OutputField(desc="often between 1 and 5 words")

class ChatAgent:
    def __init__(self, ollama_base_url="http://localhost:11434", ollama_model="gemma3:27b"):
        """Initializes the Chat Agent with Ollama configuration."""
        # Configure the language model
        # Make sure your Ollama server is running and accessible at ollama_base_url
        # Use ollama_base_url="http://<your-tunnel-url>" if tunneled
        # ollama_llm = dspy.OllamaLocal(model=ollama_model, base_url=ollama_base_url)
        ollama_llm = dspy.LM(model="openai/" + ollama_model, api_key="can_be_anything", api_base=ollama_base_url + '/v1')
        dspy.settings.configure(lm=ollama_llm)

        # Define the predictor
        self.predictor = dspy.Predict(BasicQA)

    def ask(self, question: str) -> str:
        """Asks a question to the LLM and returns the answer."""
        pred = self.predictor(question=question)
        return pred.answer

# Example usage (can be removed or kept for testing)
if __name__ == '__main__':
    # Replace with your actual Ollama URL if not default or tunneled
    # e.g., agent = ChatAgent(ollama_base_url="http://your-tunnel-domain.com")
    agent = ChatAgent()
    response = agent.ask("What is the capital of France?")
    print(f"Q: What is the capital of France?")
    print(f"A: {response}")

    while True:
        user_input = input("Ask something (or type 'quit'): ")
        if user_input.lower() == 'quit':
            break
        response = agent.ask(user_input)
        print(f"A: {response}")
