import os
from dotenv import load_dotenv
from langchain_nvidia import ChatNVIDIA
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder  # <-- 1. IMPORT ADDED
from langchain.chains import create_retrieval_chain
from langchain_core.messages import HumanMessage, AIMessage
from langchain.chains import create_history_aware_retriever

load_dotenv()
DB_FAISS_PATH = "vectorstore/db_faiss"
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")


def build_chain():
    """Builds and returns the RAG chain exactly like in chatbot.py."""
    if not NVIDIA_API_KEY:
        raise ValueError("NVIDIA_API_KEY not found in .env")

    #Initialize LLM
    llm = ChatNVIDIA(
        model="nvidia/nemotron-mini-4b-instruct",
        api_key=NVIDIA_API_KEY,
        temperature=0.3
    )

    #Embeddings & Retriever
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'device': 'cpu'}
    )

    if not os.path.exists(DB_FAISS_PATH):
        raise FileNotFoundError("FAISS database not found. Run ingest.py first.")

    db = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
    retriever = db.as_retriever(search_type="similarity", search_kwargs={'k': 3})

    #Contextualization
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", "Given a chat history and the latest user question which might reference context in the chat history, "
                   "formulate a standalone question. Do NOT answer it, only rewrite."),
        MessagesPlaceholder(variable_name="chat_history"),  # <-- 2. THIS WAS CHANGED
        ("human", "Input: {input}"),
        ("human", "Standalone question:")
    ])
    history_aware_retriever = create_history_aware_retriever(llm, retriever, contextualize_q_prompt)

    #Prompt 
    qa_prompt = ChatPromptTemplate.from_template("""
    You are "CampusPal," a friendly and expert AI assistant for A.P. Shah Institute of Technology (APSIT).
    Use the context below to answer accurately and concisely.

    <context>
    {context}
    </context>

    Question: {input}
    Answer:
    """)

    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)
    print("RAG Chain initialized successfully.")
    return rag_chain