import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Literal
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from langchain_core.messages import HumanMessage, AIMessage, BaseMessage
from rag_chain_builder import build_chain  #  import the shared builder

load_dotenv()

#Globals
rag_chain = None

# Data Models
class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str

class ChatRequest(BaseModel):
    input: str
    chat_history: List[ChatMessage] = Field(default_factory=list)

class ChatResponse(BaseModel):
    answer: str

#FastAPI Setup
@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_chain
    print("Starting CampusPal backend...")
    rag_chain = build_chain()
    yield
    print("Shutting down...")

app = FastAPI(
    title="CampusPal API",
    description="RAG backend for APSIT assistant",
    lifespan=lifespan
)

# Allow React frontend to connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # (restrict to your frontend URL later)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#API Endpoints
@app.get("/")
def root():
    return {"status": "CampusPal backend running"}

@app.post("/chat", response_model=ChatResponse)
def chat_with_bot(request: ChatRequest):
    global rag_chain
    if not rag_chain:
        return {"answer": "Error: RAG chain not initialized."}

    # Convert history
    lc_chat_history: List[BaseMessage] = [
        HumanMessage(content=m.content) if m.role == "user" else AIMessage(content=m.content)
        for m in request.chat_history
    ]

    try:
        response = rag_chain.invoke({
            "chat_history": lc_chat_history,
            "input": request.input
        })
        return {"answer": response.get("answer", "Sorry, I couldn't find an answer.")}
    except Exception as e:
        print(f"Error during chat: {e}")
        return {"answer": f"Internal error: {e}"}

#Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
