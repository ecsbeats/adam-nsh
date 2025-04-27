from agent import ChatAgent

def main():
    print("Initializing Chat Agent...")
    # Configure with your Ollama URL if needed, e.g.:
    # agent = ChatAgent(ollama_base_url="http://your-tunnel-url")
    agent = ChatAgent() # Assumes default http://localhost:11434
    print("Chat Agent Ready. Type 'quit' to exit.")

    while True:
        try:
            user_input = input("You: ")
            if user_input.lower() == 'quit':
                break
            if not user_input:
                continue

            response = agent.ask(user_input)
            print(f"AI: {response}")

        except EOFError:
            # Handle Ctrl+D
            print("\nExiting.")
            break
        except KeyboardInterrupt:
            # Handle Ctrl+C
            print("\nExiting.")
            break

if __name__ == "__main__":
    main()
