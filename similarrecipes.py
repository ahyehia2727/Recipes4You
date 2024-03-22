from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import logging
import nltk
from nltk.corpus import stopwords

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')

app = Flask(__name__)
CORS(app)

# Load your precomputed data
df = pd.read_pickle("processed_df.pkl")
cosine_sim = np.load('cosine_sim.npy')

nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

def preprocess_text(text):
    # Tokenization and removing stop words
    tokens = [word for word in text.split() if word not in stop_words]
    return ' '.join(tokens)


@app.route('/get-similar-recipes', methods=['POST'])
def get_similar_recipes():
    logging.debug("Received request for similar recipes.")
    try:
        data = request.json
        recipe_label = data['label'].lower()
        recipe_label = preprocess_text(recipe_label)  
        
        logging.debug(f"Recipe label received: {recipe_label}")

        # Find the index of the recipe in the DataFrame
        idx = df.index[df['label'].str.lower() == recipe_label].tolist()
        if not idx:
            raise ValueError(f"No recipe found for label: {recipe_label}")
        idx = idx[0]

        # Compute similarity scores and filter based on threshold
        sim_scores = list(enumerate(cosine_sim[idx]))
        sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:]  # Exclude self

        # Filter out recipes with a cosine similarity below 0.82
        similar_recipes = [{"url": df.iloc[i]['url'], "cosineSimilarity": score} for i, score in sim_scores if score > 0.82]

        logging.debug(f"Found {len(similar_recipes)} similar recipes.")
        return jsonify(similar_recipes)
    except Exception as e:
        logging.error(f"Error in finding similar recipes: {e}")
        return jsonify({"error": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
