# from rag_chain_builder import build_chain
# from langchain_core.messages import HumanMessage

def debug_query(query):

    # The chain structure is: 
    # { "chat_history": ..., "input": ... } | history_aware_retriever | ...
    
    # We need to manually invoke the retriever part.
    # Looking at rag_chain_builder.py, the chain starts with history_aware_retriever
    
    # Let's inspect the chain object to find the retriever or just rebuild a retriever here.
    # Since build_chain returns the full chain, extracting the retriever might be tricky depending on how it's composed.
    
    # Alternatively, we can just run the chain and see if we can get the context. 
    # But usually the context is internal.
    
    # Better approach: Re-instantiate the vectorstore/retriever exactly as in rag_chain_builder using the same code.
    import os
    from langchain_huggingface import HuggingFaceEmbeddings
    from langchain_community.vectorstores import FAISS

    if not os.environ.get("NVIDIA_API_KEY"):
        # Load from .env if needed, though the environment should have it
        from dotenv import load_dotenv
        load_dotenv()

    try:
        BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        DB_FAISS_PATH = os.path.join(BASE_DIR, "vectorstore", "db_faiss")
        embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        vectorstore = FAISS.load_local(DB_FAISS_PATH, embeddings, allow_dangerous_deserialization=True)
        retriever = vectorstore.as_retriever(search_kwargs={'k': 5}) # Same as current settings
        
        docs = retriever.invoke(query)
        
        print(f"Retrieved {len(docs)} documents:")
        for i, doc in enumerate(docs):
            print(f"\n[Doc {i+1}] Source: {doc.metadata.get('source', 'Unknown')}")
            print(f"Content Preview: {doc.page_content[:300]}...") # Print first 300 chars
            
    except Exception as e:
        print(f"Error initializing retriever: {e}")

if __name__ == "__main__":
    queries = [
        "what is the fees of the college",
        "who is principle of college",
        "how is the placement in college",
        "how to reach the college"
    ]
    
    for q in queries:
        debug_query(q)
