import streamlit as st
import os
import time
from dotenv import load_dotenv
from langchain_nvidia import ChatNVIDIA  
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain.chains import create_retrieval_chain
from langchain_core.messages import HumanMessage, AIMessage
from langchain.chains import create_history_aware_retriever


load_dotenv()
DB_FAISS_PATH = "vectorstore/db_faiss"
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

st.set_page_config(page_title="CampusPal Chatbot")
st.title("CampusPal: Your APSIT AI Assistant (NVIDIA Edition)")
st.markdown("---")

@st.cache_resource
def setup_chain():
    
    try:
       
        llm = ChatNVIDIA(
            model="nvidia/nemotron-mini-4b-instruct",
            api_key=NVIDIA_API_KEY,
            temperature=0.3
        )

        #  Embeddings + Retriever
        embeddings = HuggingFaceEmbeddings(
            model_name='sentence-transformers/all-MiniLM-L6-v2',
            model_kwargs={'device': 'cpu'}
        )
        db = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
        # Improved retrieval: return fewer but higher quality results to reduce noise
        retriever = db.as_retriever(
            search_type="similarity",
            search_kwargs={'k': 3}  # Reduced from 5 to 3 for more focused answers
        )

        
        #  Contextualized Prompt (Corrected)
        contextualize_q_prompt = ChatPromptTemplate.from_messages([
            ("system", "Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question. Do NOT answer it, only rewrite."),
            MessagesPlaceholder(variable_name="chat_history"), 
            ("human", "Input: {input}"),
            ("human", "Standalone question:")
        ])

        history_aware_retriever = create_history_aware_retriever(
            llm, retriever, contextualize_q_prompt
        )

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
        return rag_chain

    except Exception as e:
        st.error(f" Failed to initialize chain: {e}")
        return None


# Initialize Retrieval Chain
retrieval_chain = setup_chain()


# Chat Session State
if "messages" not in st.session_state:
    st.session_state.messages = [
        {"role": "assistant", "content": "Hello! 👋 I'm CampusPal — your APSIT AI guide. How can I help you today?"}
    ]


# Chat Interface
if retrieval_chain:
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if user_query := st.chat_input("Ask about admissions, placements, or fees..."):
        st.session_state.messages.append({"role": "user", "content": user_query})
        with st.chat_message("user"):
            st.markdown(user_query)

        with st.chat_message("assistant"):
            
            # chat_history_for_chain
            # Format chat history for the chain
            chat_history_for_chain = []
            # Get all messages *except* the new one (which is the last one)
            for msg in st.session_state.messages[:-1]: 
                if msg["role"] == "user":
                    chat_history_for_chain.append(HumanMessage(content=msg["content"]))
                elif msg["role"] == "assistant":
                    chat_history_for_chain.append(AIMessage(content=msg["content"]))
            

            response = retrieval_chain.invoke({
                "chat_history": chat_history_for_chain, # <-- This variable is now defined
                "input": user_query
            })

            st.markdown(response['answer'])


        st.session_state.messages.append({"role": "assistant", "content": response['answer']})
else:
    st.warning("Chatbot initialization failed. Please check FAISS database or API key.")