
from langchain_huggingface import HuggingFaceEmbeddings
try:
    embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    print("Embeddings Initialized Successfully")
except Exception as e:
    print(f"Error: {e}")
