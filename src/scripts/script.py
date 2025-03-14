from typing import List
import numpy as np
from fastembed import TextEmbedding
import sys
text = sys.argv[1]
# print("Received text:", text)
embedding_model = TextEmbedding()
# print("The model BAAI/bge-small-en-v1.5 is ready to use.")
embeddings_generator = embedding_model.embed(text)
embeddings_list = list(embeddings_generator)
len(embeddings_list[0])  
# print("Embeddings:\n", embeddings_list)
embedding = np.array(embeddings_list)
clean_embedding = np.nan_to_num(embedding, nan=0.0)  # Replace NaN with 0
print("Clean vector:", clean_embedding.tolist())