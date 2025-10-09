import os
import glob
from tqdm import tqdm
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings


# Define paths for your data and the place to save the vector store.
TXT_DATA_PATH = "scraper/data/"
PDF_DATA_PATH = "scraper/apsit_documents/"
DB_FAISS_PATH = "vectorstore/db_faiss"


def create_vector_db_advanced():
    """
    This function creates a robust FAISS vector database from text and PDF files.
    It processes files individually, handles errors gracefully, and provides detailed feedback.
    """
    
    all_documents = []
    failed_files = []
    
    print("--- Starting Advanced Document Ingestion ---")

    #Load Text Files Individually
    print(f"\n[Phase 1/4] Scanning for text files in '{TXT_DATA_PATH}'...")
    txt_files = glob.glob(os.path.join(TXT_DATA_PATH, "*.txt"))
    
    if txt_files:
        print(f"Found {len(txt_files)} text files. Processing them now...")
        for file_path in tqdm(txt_files, desc="Processing TXT files"):
            try:
                # Use TextLoader for individual files, which handles encoding better.
                loader = TextLoader(file_path, encoding='utf-8')
                documents = loader.load()
                all_documents.extend(documents)
            except Exception as e:
                # If a file fails, log it and continue with the others.
                print(f"\n[ERROR] Failed to load {file_path}: {e}")
                failed_files.append(file_path)
    else:
        print("No text files found in the specified directory.")

    # Load PDF Files Individually 
    print(f"\n[Phase 2/4] Scanning for PDF files in '{PDF_DATA_PATH}'...")
    if os.path.exists(PDF_DATA_PATH):
        pdf_files = glob.glob(os.path.join(PDF_DATA_PATH, "*.pdf"))
        
        if pdf_files:
            print(f"Found {len(pdf_files)} PDF files. Processing them now...")
            for file_path in tqdm(pdf_files, desc="Processing PDF files"):
                try:
                    loader = PyPDFLoader(file_path)
                    documents = loader.load()
                    all_documents.extend(documents)
                except Exception as e:
                    print(f"\n[ERROR] Failed to load {file_path}: {e}")
                    failed_files.append(file_path)
        else:
            print("No PDF files found in the specified directory.")
    else:
        print(f"PDF data path '{PDF_DATA_PATH}' does not exist. Skipping.")

    
    if not all_documents:
        print("\n--- Ingestion Summary ---")
        print("No documents were successfully loaded. Halting process.")
        if failed_files:
            print("\nThe following files failed to load:")
            for f in failed_files:
                print(f"- {f}")
        return

   
    print("\n[Phase 3/4] Splitting all loaded documents into smaller chunks...")
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    chunks = text_splitter.split_documents(all_documents)
    print(f"Successfully split documents into {len(chunks)} chunks.")

    
    print("\n[Phase 4/4] Creating embeddings and building the FAISS vector store...")
    
    
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'device': 'cpu'} 
    )

    # Create the FAISS vector store from the chunks and embeddings.
    db = FAISS.from_documents(chunks, embeddings)
    
    # Save the vector store locally.
    db.save_local(DB_FAISS_PATH)
    print(f"FAISS index created and saved at '{DB_FAISS_PATH}'")

   
    print("\n--- Ingestion Complete ---")
    print(f"Successfully processed and stored content from {len(all_documents)} documents.")
    print(f"Total chunks created: {len(chunks)}")
    if failed_files:
        print(f"\nWARNING: {len(failed_files)} file(s) failed to load and were skipped:")
        for f in failed_files:
            print(f"- {f}")
    print("----------------------------")

if __name__ == "__main__":
    create_vector_db_advanced()

