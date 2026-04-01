import os
import glob
from tqdm import tqdm
from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
import pandas as pd

#Paths 
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_DIR, "scraper", "data")          # Scraped text, PDF texts, and CSVs
PDF_EXTRA_PATH = os.path.join(BASE_DIR, "scraper", "apsit_documents")  # Optional: Manually add PDFs here
DB_FAISS_PATH = os.path.join(BASE_DIR, "vectorstore", "db_faiss")

# Convert CSV to text 
def csv_to_text(file_path):
    try:
        df = pd.read_csv(file_path)
        return df.to_string(index=False)
    except Exception as e:
        print(f"[ERROR] Failed to read CSV {file_path}: {e}")
        return ""

#  Main Function 
def create_vector_db_advanced():
    all_documents = []
    failed_files = []

    print("--- Starting Advanced Document Ingestion ---")
    os.makedirs(DB_FAISS_PATH, exist_ok=True)

    # Load all TXT files (from pages AND scraped PDFs)
    # Use recursive=True to find files in data/ and data/pdfs/
    txt_files = glob.glob(os.path.join(DATA_PATH, "**/*.txt"), recursive=True)
    print(f"[Phase 1/4] Found {len(txt_files)} TXT files (page text + PDF text).")
    for file_path in tqdm(txt_files, desc="Loading TXT files"):
        try:
            loader = TextLoader(file_path, encoding='utf-8')
            all_documents.extend(loader.load())
        except Exception as e:
            print(f"[ERROR] TXT load failed {file_path}: {e}")
            failed_files.append(file_path)

    # Load all PDFs (from optional manual-add folder)
    pdf_files = glob.glob(os.path.join(PDF_EXTRA_PATH, "*.pdf"))
    print(f"[Phase 2/4] Found {len(pdf_files)} optional PDF files.")
    for file_path in tqdm(pdf_files, desc="Loading PDFs"):
        try:
            loader = PyPDFLoader(file_path)
            all_documents.extend(loader.load())
        except Exception as e:
            print(f"[ERROR] PDF load failed {file_path}: {e}")
            failed_files.append(file_path)

    # Load CSV tables as text
    csv_files = glob.glob(os.path.join(DATA_PATH, "*.csv"))
    print(f"[Phase 3/4] Found {len(csv_files)} CSV table files.")
    for file_path in tqdm(csv_files, desc="Loading CSVs"):
        text = csv_to_text(file_path)
        if text and text.strip():
            all_documents.append(Document(page_content=text, metadata={"source": file_path}))
    
    # Filter out any documents with empty content
    print(f"[Phase 4/4] Filtering empty documents...")
    all_documents = [doc for doc in all_documents if doc.page_content and isinstance(doc.page_content, str) and doc.page_content.strip()]
    
    print(f"Splitting {len(all_documents)} documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,
        chunk_overlap=200
    )
    
    if not all_documents:
        print("No documents loaded after filtering. Exiting.")
        return

    chunks = text_splitter.split_documents(all_documents)
    print(f"Total chunks created: {len(chunks)}")
    
    # Validation: Ensure all chunks have valid content
    valid_chunks = []
    for chunk in chunks:
        if chunk.page_content and isinstance(chunk.page_content, str) and chunk.page_content.strip():
            valid_chunks.append(chunk)
    
    print(f"Valid chunks after filtering: {len(valid_chunks)} (Removed {len(chunks) - len(valid_chunks)})")
    
    if not valid_chunks:
        print("No valid chunks to serve. Exiting.")
        return

    # Create embeddings + FAISS store
    print("Creating embeddings and FAISS vector store...")
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'device': 'cpu'}
    )

    db = FAISS.from_documents(valid_chunks, embeddings)
    db.save_local(DB_FAISS_PATH)
    print(f"FAISS index saved at '{DB_FAISS_PATH}'")

    # 6Summary
    print("\n--- Ingestion Summary ---")
    print(f"Total documents loaded: {len(all_documents)}")
    print(f"Total chunks created: {len(chunks)}")
    if failed_files:
        print(f"Failed files ({len(failed_files)}):")
        for f in failed_files:
            print(f"- {f}")
    print("----------------------------")


if __name__ == "__main__":
    create_vector_db_advanced()