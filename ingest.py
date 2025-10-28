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
DATA_PATH = "scraper/data/"          # Scraped text, PDF texts, and CSVs
PDF_EXTRA_PATH = "scraper/apsit_documents/"  # Optional: Manually add PDFs here
DB_FAISS_PATH = "vectorstore/db_faiss"

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
        if text:
            try:
                # Create a Document object directly from the CSV text
                doc = Document(
                    page_content=text,
                    metadata={"source": file_path}
                )
                all_documents.append(doc)
            except Exception as e:
                print(f"[ERROR] CSV load failed {file_path}: {e}")
                failed_files.append(file_path)

    if not all_documents:
        print("No documents loaded. Scraper may not have run. Exiting.")
        return

    # Split into chunks - larger chunks reduce noise from navigation elements
    print("[Phase 4/4] Splitting documents into chunks...")
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=1500,  # Increased to reduce fragmentation
        chunk_overlap=200  # Increased overlap for better context
    )
    chunks = text_splitter.split_documents(all_documents)
    print(f"Total chunks created: {len(chunks)}")

    # Create embeddings + FAISS store
    print("Creating embeddings and FAISS vector store...")
    embeddings = HuggingFaceEmbeddings(
        model_name='sentence-transformers/all-MiniLM-L6-v2',
        model_kwargs={'device': 'cpu'}
    )

    db = FAISS.from_documents(chunks, embeddings)
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