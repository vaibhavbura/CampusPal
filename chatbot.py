import streamlit as st
import os
import time
from langchain_ollama import ChatOllama
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from langchain_core.messages import HumanMessage, AIMessage
# NEW IMPORT for creating the history-aware retriever
from langchain.chains import create_history_aware_retriever
from dotenv import load_dotenv

load_dotenv()
DB_FAISS_PATH = "vectorstore/db_faiss"

st.set_page_config(page_title="CampusPal Chatbot")
st.title("CampusPal: Your APSIT AI Assistant")
st.markdown("---")

@st.cache_resource
def setup_chain():
    """Loads models and creates the full conversational RAG chain."""
    llm = ChatOllama(model="llama3:8b", temperature=0.3)
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'device': 'cpu'}
    )
    
    try:
        db = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = db.as_retriever(search_type="similarity", search_kwargs={'k': 5})

        # prompt
        contextualize_q_prompt = ChatPromptTemplate.from_messages(
            [
                ("system", "Given a chat history and the latest user question which might reference context in the chat history, formulate a standalone question which can be understood without the chat history. Do NOT answer the question, just reformulate it if needed and otherwise return it as is."),
                ("human", "{chat_history}"),
                ("human", "Input: {input}"),
                ("human", "Standalone question:"),
            ]
        )
        
        
        history_aware_retriever = create_history_aware_retriever(
            llm, retriever, contextualize_q_prompt
        )

        
        qa_prompt = ChatPromptTemplate.from_template("""
        You are "CampusPal," a friendly and expert AI assistant for A.P. Shah Institute of Technology (APSIT).
        Answer the user's question based ONLY on the provided context.
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
        st.error(f"Failed to load vector store: {e}. Please run ingest.py first.")
        return None

retrieval_chain = setup_chain()

if "messages" not in st.session_state:
    st.session_state.messages = [{"role": "assistant", "content": "Hello! I'm CampusPal. How can I help you with your questions about APSIT today?"}]

if retrieval_chain:
    for message in st.session_state.messages:
        with st.chat_message(message["role"]):
            st.markdown(message["content"])

    if prompt_input := st.chat_input("Ask about admissions, courses, or fees..."):
        st.session_state.messages.append({"role": "user", "content": prompt_input})
        with st.chat_message("user"):
            st.markdown(prompt_input)

        with st.chat_message("assistant"):
            with st.spinner("Thinking..."):
               
                chat_history_for_chain = [
                    HumanMessage(content=msg["content"]) if msg["role"] == "user" else AIMessage(content=msg["content"])
                    for msg in st.session_state.messages[:-1] 
                ]
                
                response = retrieval_chain.invoke({
                    "chat_history": chat_history_for_chain,
                    "input": prompt_input
                })

                st.markdown(response['answer'])

                with st.expander("Show Sources"):
                    for doc in response["context"]:
                        st.info(f"Source: {os.path.basename(doc.metadata.get('source', 'Unknown'))}")
                        st.write(doc.page_content)
        
        st.session_state.messages.append({"role": "assistant", "content": response['answer']})
else:
    st.warning("Chatbot is not ready.")