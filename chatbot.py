import streamlit as st
import os
import time
from langchain_nvidia_ai_endpoints import ChatNVIDIA
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain.chains import create_retrieval_chain
from dotenv import load_dotenv

load_dotenv()

DB_FAISS_PATH = "vectorstore/db_faiss"

st.set_page_config(page_title="CampusPal Chatbot Demo")
st.title("CampusPal: Your APSIT AI Assistant ")
st.markdown("---")

llm = ChatNVIDIA(model="mistralai/mixtral-8x7b-instruct-v0.1")

embeddings = HuggingFaceEmbeddings(
    model_name='sentence-transformers/all-MiniLM-L6-v2',
    model_kwargs={'device': 'cpu'}
)


prompt = ChatPromptTemplate.from_template(
"""
You are "CampusPal," a friendly and expert AI assistant for the A.P. Shah Institute of Technology (APSIT).
Your goal is to provide helpful, clear, and encouraging answers to prospective and current students.
Your tone should be professional, yet warm and welcoming.

**Instructions:**
1.  Answer the user's question based ONLY on the provided context.
2.  If the context contains the answer, synthesize it into a clear, easy-to-understand response. Do not just copy the text.
3.  If the context does not contain the answer, politely say, "I don't have specific information on that topic, but I can help with other questions about admissions, courses, or campus life at APSIT." Do not make up answers.
4.  Begin your response with a friendly greeting, like "Hello!" or "Thanks for asking!".
5.  Keep the language simple and direct. Avoid overly technical jargon.

<context>
{context}
<context>

**Question:** {input}

**Answer:**
"""
)

def create_rag_chain():
    """Creates the RAG chain for the chatbot."""
    try:
        db = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = db.as_retriever(search_type="similarity", search_kwargs={'k': 5})
        document_chain = create_stuff_documents_chain(llm, prompt)
        retrieval_chain = create_retrieval_chain(retriever, document_chain)
        return retrieval_chain
    except Exception as e:
        st.error(f"Failed to load vector store: {e}. Did you run ingest.py?")
        return None

retrieval_chain = create_rag_chain()

if retrieval_chain:
    prompt_input = st.text_input("Ask a question about APSIT admissions, courses, or fees...")

    if prompt_input:
        start_time = time.process_time()
        response = retrieval_chain.invoke({"input": prompt_input})
        response_time = time.process_time() - start_time
        print(f"Response time: {response_time:.2f} seconds")
        
        st.write("### Answer")
        st.write(response['answer'])

        # with st.expander("Show Sources"):
        #     st.write("The answer was generated based on the following information:")
        #     for doc in response["context"]:
        #         st.info(f"Source: {os.path.basename(doc.metadata.get('source', 'Unknown'))}")
        #         st.write(doc.page_content)
        #         st.write("---")
else:
    st.warning("Chatbot is not ready.")