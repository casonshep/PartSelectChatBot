from fastapi import FastAPI, Request
from sentence_transformers import SentenceTransformer
import faiss
import numpy as np
import json
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import pickle
import re

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the sentence model for embedding search
model = SentenceTransformer("BAAI/bge-small-en")


# Load the FAISS index
index = faiss.read_index(r'data/embedded_chunks.faiss')


# Load the chunk metadata
with open(r'data/embedded_chunks_metadata.json', "r") as f:
    metadata = json.load(f)


#Load part information table and generate set of PartSelect codes
part_info_df = pd.read_csv(r'data/part_info_final.csv')
PS_codes = set(part_info_df['PS CODE'].to_numpy())


#Load model-part connection graph
with open(r"data/model_parts_graph.gpickle", "rb") as f:
    model_part_G = pickle.load(f)


# For finding model codes in the give query
def find_alphanum_words(sentence):
    pattern = r'\b(?=\w*[A-Za-z])(?=\w*\d)\w+\b'
    return re.findall(pattern, sentence)


# Retrieves the information we have given a PartSelect code
def retrieve_part_info(PS_code):
    mask = part_info_df.apply(lambda row: PS_code in str(row.values), axis=1)
    matching_row = part_info_df[mask]

    if not matching_row.empty:
        row_string = " | ".join(matching_row.iloc[0].astype(str))
    return row_string


@app.post("/search")
async def search(request: Request):
    data = await request.json()
    query_text = data.get("query", "")
    
    #Check if they referenced a specific part
    part_codes_in_query = re.findall(r'\b\w*PS\w*\b', query_text.upper())

    #Generate list of part information from what the user asked
    part_info = []
    for code in part_codes_in_query:
        part_info.append(retrieve_part_info(code))

    # Check if a model was referenced and grab information of related parts
    # from dependency graph
    model_info = {}
    model_codes_in_query = find_alphanum_words(query_text.upper())
    for model_code in model_codes_in_query:
        model_info[model_code] = []
        neighbors = list(model_part_G.neighbors(model_code))
        for part_code in neighbors:
            model_info[model_code].append(retrieve_part_info(part_code))
    
    # Get embeddings and perform FAISS search
    query_embedding = model.encode(query_text)
    query_embedding = np.array([query_embedding])
    distances, indices = index.search(query_embedding, k=5)  # Get top 5 results

    # Get the corresponding metadata (original text)
    results = []
    for idx in indices[0]:
        result = metadata[idx]
        results.append(result)
    
    return {"chunks": results, "distances": distances.tolist(), "part_info": part_info, "model_info": model_info}

# Run the server with `uvicorn server:app --reload`
