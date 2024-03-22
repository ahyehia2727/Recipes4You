import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import logging
from pymongo import MongoClient
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
import pickle

# Configure logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s %(levelname)s: %(message)s')

# Load your precomputed data
client = MongoClient('mongodb://localhost:27017/')
db = client['Recipes']
collection = db['recipes']

recipes = collection.find({})  # Adjust the query as needed

# Extract relevant fields
data = []
for recipe in recipes:
    # Modify as per your schema
    data.append({
        "url":recipe["recipe"]["url"],
        "label": recipe["recipe"]["label"],
        "servings": recipe["recipe"]["yield"],
        "dietLabels": recipe["recipe"]["dietLabels"],
        "healthLabels": recipe["recipe"]["healthLabels"],
        "cuisineType": recipe["recipe"]["cuisineType"],
        "mealType": recipe["recipe"]["mealType"],
        "dishType": recipe["recipe"]["dishType"],
        "calories": recipe["recipe"]["calories"],
        "totalWeight": recipe["recipe"]["totalWeight"],
        "fatGrams": recipe["recipe"]["digest"][0]["total"], 
        "saturatedFat": recipe["recipe"]["digest"][0]["sub"][0]["total"],
        "carbs": recipe["recipe"]["digest"][1]["total"],
        "protein": recipe["recipe"]["digest"][2]["total"],
    })


import pandas as pd

# Convert to DataFrame
df = pd.DataFrame(data)

for col in ['dietLabels', 'healthLabels', 'cuisineType', 'mealType', 'dishType']:
    df[col] = df[col].apply(lambda x: ','.join(map(str.lower, set(x))))

split_and_lowercase = lambda x: set(word.lower() for word in x.split(','))

# Split the labels into words
df['dietWords'] = df['dietLabels'].apply(split_and_lowercase)
df['healthWords'] = df['healthLabels'].apply(split_and_lowercase)
df['cuisineWords'] = df['cuisineType'].apply(split_and_lowercase)
df['mealWords'] = df['mealType'].apply(split_and_lowercase)
df['dishWords'] = df['dishType'].apply(split_and_lowercase)

# Get unique words
unique_diet_words = set().union(*df['dietWords'])
unique_health_words = set().union(*df['healthWords'])
unique_cuisine_words = set().union(*df['cuisineWords'])
unique_meal_words = set().union(*df['mealWords'])
unique_dish_words = set().union(*df['dishWords'])

# Function to encode words
encode_words = lambda words, unique_words: [word in words for word in unique_words]

# Apply one-hot encoding for words
for word in unique_diet_words:
    df[word] = df['dietWords'].apply(lambda x: word in x)

for word in unique_health_words:
    df[word] = df['healthWords'].apply(lambda x: word in x)

for word in unique_cuisine_words:
    df[word] = df['cuisineWords'].apply(lambda x: word in x)

for word in unique_meal_words:
    df[word] = df['mealWords'].apply(lambda x: word in x)

for word in unique_dish_words:
    df[word] = df['dishWords'].apply(lambda x: word in x)

# Drop intermediate columns
df.drop(['dietLabels', 'healthLabels','cuisineType','mealType','dishType', 'dietWords', 'healthWords','cuisineWords','mealWords','dishWords'], axis=1, inplace=True)

df['label'] = df['label'].str.lower()

# Tokenization, Removing Stop Words, and Stemming
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

from sklearn.feature_extraction.text import TfidfVectorizer

# TF-IDF Vectorization for 'label' column
tfidf_vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = tfidf_vectorizer.fit_transform(df['label'])

from sklearn.preprocessing import MinMaxScaler

# Select numerical columns for normalization
numerical_cols = ['servings', 'calories', 'totalWeight', 'fatGrams', 'saturatedFat', 'carbs', 'protein']
scaler = MinMaxScaler()
df[numerical_cols] = scaler.fit_transform(df[numerical_cols])

import numpy as np

# Convert TF-IDF matrix to DataFrame
tfidf_df = pd.DataFrame(tfidf_matrix.toarray(), columns=tfidf_vectorizer.get_feature_names_out())

# Combine TF-IDF features with other features
combined_features = pd.concat([tfidf_df, df.drop(['url','label'], axis=1)], axis=1)

# Save the pre-computed TF-IDF matrix and other features
combined_features.to_pickle("combined_features.pkl")

# Compute and save the cosine similarity matrixz
cosine_sim = cosine_similarity(combined_features, combined_features)

np.save("cosine_sim.npy", cosine_sim)

# Save the processed dataframe to a pickle file (this is optional if you want to save the original dataframe before combining with TF-IDF features)
df.to_pickle("processed_dataframe.pkl")
