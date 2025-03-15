from fastapi import FastAPI
import openai
import os
from dotenv import load_dotenv

load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

app = FastAPI()

@app.get("/")
def read_root():
    return {"msg": "Hello from Labster Quiz Generator!"}
