# CampusPal: An AI Assistant for A.P. Shah Institute of Technology

CampusPal is an advanced, conversational AI assistant designed to provide instant, accurate, and friendly answers to questions about the A.P. Shah Institute of Technology (APSIT). It leverages a Retrieval-Augmented Generation (RAG) pipeline to ensure all responses are grounded in factual information scraped from the official college website and documents.



## 🛠️ Technology Stack

* **Orchestration**: LangChain

* **LLM**: Ollama (with Llama 3) / NVIDIA AI Endpoints

* **Vector Store**: FAISS

* **Embeddings**: Hugging Face sentence-transformers

* **UI**:Streamlit

* **Data Ingestion**: Python, BeautifulSoup, PyPDF
--- 
## 🚀 Getting Started

Follow these steps to set up and run the CampusPal chatbot on your local machine.

### **1. Prerequisites**

* Python 3.10+

* Ollama installed and running.

* The Llama 3 model pulled via Ollama (ollama pull llama3:8b)

### **2. Clone the Repository**

```bash
git clone [https://github.com/vaibhavbura/CampusPal.git](https://github.com/vaibhavbura/CampusPal.git)
cd CampusPal
```

### **3. Set Up the Environment**

Create and activate a virtual environment, then install the required packages.

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### **4. Scrape Data and Build the Knowledge Base**



Run the scraping and ingestion scripts to build the FAISS vector store.



```bash

# scraper/main.py

python main.py



# Run the ingestion script to create the vector store

python ingest.py

```



### **5. Run the Chatbot**



Launch the Streamlit application.



```bash

streamlit run app.py

```



Your browser will open a new tab with the CampusPal interface, ready for you to start asking questions!
