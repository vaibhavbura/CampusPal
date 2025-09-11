import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import DirectoryLoader, PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

TXT_DATA_PATH = "scraper/data/"
PDF_DATA_PATH = "scraper/apsit_documents/" 
DB_FAISS_PATH = "vectorstore/db_faiss"

def create_vector_db():
    """
    This function creates a FAISS vector database from text and PDF files.
    """
    
    print("Loading documents...")
    
    # Load text files
    txt_loader = DirectoryLoader(TXT_DATA_PATH, glob="*.txt")
    txt_documents = txt_loader.load()

    # Load PDF files
    pdf_documents = []
    if os.path.exists(PDF_DATA_PATH):
        pdf_loader = DirectoryLoader(PDF_DATA_PATH, glob="*.pdf", loader_cls=PyPDFLoader)
        pdf_documents = pdf_loader.load()

    # Combine all loaded documents
    documents = txt_documents + pdf_documents
    if not documents:
        print("No documents found. Please check your data folders.")
        return

    # Split Documents into Chunks ---
    print("Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(documents)

    # Create Embeddings ---
    # We will use a powerful, open-source embedding model from Hugging Face
    print("Creating embeddings...")
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'device': 'cpu'} # 'cuda' for local GPU
    )

    # Create and Save the FAISS Vector Store ---
    print("Creating and saving the FAISS vector store...")
    db = FAISS.from_documents(chunks, embeddings)
    db.save_local(DB_FAISS_PATH)

    print(f"\nSuccessfully loaded {len(documents)} documents.")
    print(f"Split them into {len(chunks)} chunks.")
    print(f"FAISS index created and saved at {DB_FAISS_PATH}")

if __name__ == "__main__":
    create_vector_db()