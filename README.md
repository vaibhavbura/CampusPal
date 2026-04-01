# CampusPal - AI Assistant for APSIT 🎓

**CampusPal** is an  AI-powered chatbot designed specifically for **A.P. Shah Institute of Technology (APSIT)**. It helps students, parents, and faculty get instant, accurate answers about the college, including fees, admissions, placements, and faculty details.

It uses a **Hybrid ReAct Agent** architecture, combining local document search (RAG) with real-time Web Search to ensure comprehensive and up-to-date responses.


## 🛡️ How We Reduced Hallucinations

We implemented a robust **5-Layer Defense System** to ensure CampusPal provides accurate facts rather than making things up:

1.  **Dedicated Fact File (Data Augmentation)**:
    *   We created a curated `campus_info_summary.txt` containing explicit, high-priority facts (e.g., specific Fee structures, Principal's name). This ensures the bot finds the exact answer for common questions immediately.
2.  **Hybrid "ReAct" Agent**:
    *   The bot doesn't just guess. It "thinks" before answering. It actively decides: *"Is this a college question? -> Use Retriever"* or *"Is this general news? -> Use Web Search"*.
3.  **Strict Prompt Engineering**:
    *   The system prompt explicitly instructs the AI: *"If you don't know the answer, just say you don't know. Do not hallucinate."*
4.  **Temperature Control (0.1)**:
    *   We set the LLM's creativity (Temperature) to `0.1`, forcing it to be deterministic and factual rather than creative.
5.  **Enhanced Retrieval (k=5)**:
    *   The RAG system retrieves **5 relevant chunks** of text (instead of the standard 3) to ensure it has enough context to answer complex queries.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Tailwind CSS (Glassmorphism UI).
*   **Backend**: Python, FastAPI.
*   **AI/LLM**: LangChain, **Groq API (Llama 3 70B)**.
*   **Vector DB**: FAISS (Facebook AI Similarity Search).
*   **Embeddings**: HuggingFace (`all-MiniLM-L6-v2`).
*   **Search**: DuckDuckGo Search (via `ddgs`).

---

## 💻 Installation & Setup

### Prerequisites
*   Python 3.10+
*   Node.js & npm
*   Groq API Key

### 1. Clone the Repository
```bash
git clone https://github.com/vaibhavbura/CampusPal.git
cd CampusPal
```

### 2. Backend Setup
```bash
# Create virtual environment
python -m venv venv

# Activate venv
# Windows:
.\venv\Scripts\activate
# Mac/Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

**Configuration**:
Create a `.env` file in the root directory:
```env
GROQ_API_KEY=gsk_your_groq_api_key_here
```

**Ingest Data**:
Initialize the knowledge base (FAISS index):
```bash
python backend/ingest.py
```

**Run Server**:
```bash
uvicorn backend.main:app --reload
```
*Backend runs on `http://localhost:8000`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Frontend runs on `http://localhost:5173`*


## 🤝 Contribution (Open to APSIT Students!)

This project is **Open Source** and we welcome contributions from **all APSIT students**! 🚀

Whether you are a First Year student or Final Year, you can contribute to:
*   **Data**: Add more PDFs/Info about your specific department or club.
*   **Frontend**: Improve the UI, add animations, or new components.
*   **Backend**: Optimize the prompt, add new tools.

**How to Contribute:**
1.  **Fork** this repository.
2.  Create a branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes.
4.  **Push** to the branch.
5.  Open a **Pull Request**.

Let's build the best AI Assistant for our campus together! 💪
