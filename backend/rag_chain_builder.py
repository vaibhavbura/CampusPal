import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.agents.tool_calling_agent.base import create_tool_calling_agent
from langchain.agents import AgentExecutor
from langchain.tools.retriever import create_retriever_tool
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FAISS_PATH = os.path.join(BASE_DIR, "vectorstore", "db_faiss")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def build_chain():
    """Builds and returns a Hybrid Agent (Groq Llama 3) using Tool Calling."""
    if not GROQ_API_KEY:
        raise ValueError("GROQ_API_KEY not found in .env")

    llm = ChatGroq(
        model="llama3-70b-8192",
        api_key=GROQ_API_KEY,
        temperature=0.1
    )

    # 2. Embeddings & Retriever
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'device': 'cpu'}
    )

    if not os.path.exists(DB_FAISS_PATH):
        raise FileNotFoundError("FAISS database not found. Run ingest.py first.")

    db = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
    retriever = db.as_retriever(search_type="similarity", search_kwargs={'k': 5})

    # 3. Define Tools
    campus_tool = create_retriever_tool(
        retriever,
        "campus_retriever",
        "Search for information about A.P. Shah Institute of Technology (APSIT), including fees, admission, faculty, placements, and campus details. ALWAYS use this tool first for college-related queries."
    )

    web_tool = DuckDuckGoSearchRun(
        name="web_search",
        description="Search the web for general knowledge, current events, or comparison data not available in the college database. Use this if 'campus_retriever' fails."
    )

    tools = [campus_tool, web_tool]

    # 4. Create Tool Calling Agent Prompt
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are CampusPal, an AI assistant for APSIT. "
                   "Use 'campus_retriever' for college info and 'web_search' for broader queries. "
                   "If you don't know, say so."),
        ("placeholder", "{chat_history}"),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}"),
    ])

    # 5. Initialize Agent with Tool Calling
    agent = create_tool_calling_agent(llm, tools, prompt)
    
    agent_executor = AgentExecutor(
        agent=agent, 
        tools=tools, 
        verbose=True, 
        handle_parsing_errors=True,
        max_iterations=5
    )

    print("Hybrid Agent (Groq + Tool Calling) initialized successfully.")
    return agent_executor