import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime
import logging
import schedule
import time
import firebase_admin
from firebase_admin import credentials, firestore
import json
from datetime import timezone
from pymongo import MongoClient
import nltk
from nltk.corpus import stopwords
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
import pickle

# Initialize Firebase Admin
cred = credentials.Certificate('your-firebase-credentials.json')
firebase_admin.initialize_app(cred)

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

def preprocess_text(text):
    # Tokenization and removing stop words
    tokens = [word for word in text.split() if word not in stop_words]
    return ' '.join(tokens)

df['label'] = df['label'].apply(preprocess_text)

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

# Compute and save the cosine similarity matrix
cosine_sim = cosine_similarity(combined_features, combined_features)

dislike_weight = -2.5
like_weight = 1.5
save_weight = 2.0
review_positive_weight = 2.5
review_negative_weight = -1.0
cook_weight = 1.0
view_duration_weight = 0.005

def time_decay(timestamp, reference_date, half_life=30):
    delta = reference_date - timestamp
    decay_factor = np.exp(-np.log(2) * delta.days / half_life)
    logging.debug(f"Time decay for delta {delta.days} days: decay_factor={decay_factor}")
    return decay_factor

def firebase_timestamp_to_datetime(timestamp):
    if isinstance(timestamp, datetime):
        return timestamp.replace(tzinfo=timezone.utc) if timestamp.tzinfo is None else timestamp
    elif hasattr(timestamp, 'seconds'):
        return datetime.fromtimestamp(timestamp.seconds + timestamp.nanoseconds / 1e9, tz=timezone.utc)
    else:
        raise ValueError(f"Invalid timestamp format: {timestamp}")

def recommend_recipes(df,interaction_df,healthLabels,dietLabels,min_recommendations=23, max_recommendations=30):
    logging.debug("Processing interaction data for recommendations.")
    # Convert timestamp strings to datetime objects
    interaction_df['timestamp'] = interaction_df['timestamp'].apply(firebase_timestamp_to_datetime)

    interaction_df['recipe_id'] = interaction_df['recipe_id'].str.lower()
    if 'review_sentiment' not in interaction_df.columns:
        interaction_df['review_sentiment'] = 0

# Check if 'view_duration' column exists, add it with default 0 values if not
    if 'view_duration' not in interaction_df.columns:
        interaction_df['view_duration'] = 0
    # Calculate weight for each interaction with time decay
    current_date = datetime.now(timezone.utc)
    interaction_df['dislike'] = interaction_df['interaction_type'].apply(lambda x: 1 if x == 'dislike' else 0)
    interaction_df['cook'] = interaction_df['interaction_type'].apply(lambda x: 1 if x == 'cook' else 0)
    interaction_df['like'] = interaction_df['interaction_type'].apply(lambda x: 1 if x == 'like' else 0)
    interaction_df['save'] = interaction_df['interaction_type'].apply(lambda x: 1 if x == 'save' else 0)
    interaction_df['review_sentiment'] = interaction_df['review_sentiment'].fillna(0)
    interaction_df['view_duration'] = interaction_df['view_duration'].fillna(0)

    interaction_df['weight'] = (interaction_df['dislike'] * dislike_weight+interaction_df['cook'] * cook_weight + interaction_df['like'] * like_weight +
                                interaction_df['save'] * save_weight +
                                interaction_df['review_sentiment'] * review_positive_weight +
                                interaction_df['view_duration'] * view_duration_weight)
    logging.debug(interaction_df)
    interaction_df['time_weighted'] = interaction_df['weight'] * interaction_df['timestamp'].apply(lambda x: time_decay(x, current_date))

    # Group by recipe and sum the time-weighted scores
    recipe_weights = interaction_df.groupby('recipe_id')['time_weighted'].sum().reset_index()
    total_weight = recipe_weights['time_weighted'].sum()

    # Log top-weighted recipes with their respective weight
    top_recipes_info = recipe_weights.sort_values(by='time_weighted', ascending=False).head(10)  # Example: Adjust the number as needed
    logging.debug(f"Top weighted recipes: {top_recipes_info}")

    recommendations = []
    names = []
    threshold = 0.82  # Initial threshold
    filtereddf = df[df[healthLabels + dietLabels].all(axis=1)]
    while len(recommendations) < min_recommendations:
        recipe_weights['percentage'] = recipe_weights['time_weighted'] / total_weight
        considered_recipes = recipe_weights.sort_values(by='time_weighted', ascending=False)
        logging.debug(f"Considering {len(considered_recipes)} recipes for recommendations with current threshold {threshold}")

        for _, row in considered_recipes.iterrows():
            if len(recommendations) >= max_recommendations:
                break  # Exit if we have enough recommendations
            recipe_percentage = row['percentage']
            num_recs_for_recipe = int(max_recommendations * recipe_percentage)
            num_recs_for_recipe = max(1, num_recs_for_recipe)  # Ensure at least one recommendation per selected recipe
            logging.debug(f"Allocating {num_recs_for_recipe} recommendations to recipe ID: {row['recipe_id']} ({recipe_percentage*100:.2f}% of total)")

            idx = filtereddf.index[filtereddf['label'] == row['recipe_id']].tolist()
            if idx:
                idx = idx[0]
                sim_scores = list(enumerate(cosine_sim[idx]))
                sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)[1:]  # Exclude self

                allocated = 0  # To track how many recommendations were actually allocated
                for i, (recipe_idx, sim_score) in enumerate(sim_scores):
                    if sim_score < threshold or allocated >= num_recs_for_recipe or len(recommendations) >= max_recommendations:
                        continue  # Skip low similarity scores based on threshold or if allocation is complete
                    if df['label'][recipe_idx] in considered_recipes['recipe_id'].tolist() or df['url'][recipe_idx] in recommendations:
                        continue  # Avoid recommending the same recipe
                    recommendations.append(df['url'][recipe_idx])
                    names.append(df['label'][recipe_idx])
                    allocated += 1
                    logging.debug(f"Added recommendation: {df['url'][recipe_idx]} with similarity score: {sim_score*100:.2f}%")

                logging.debug(f"Allocated {allocated} recommendations for recipe ID: {row['recipe_id']}")

        if len(recommendations) < min_recommendations:
            threshold -= 0.05  # Decrease threshold if not enough recommendations
            logging.debug(f"Decreased threshold to {threshold} due to insufficient recommendations.")
            if threshold <= 0:  # Avoid infinite loop
                logging.debug("Threshold reached 0, stopping search for more recommendations.")
                break

    logging.debug(f"Generated total of {len(recommendations)} recommendations.")
    return recommendations, names

def fetch_user_ids():
    """Fetch user IDs from Firestore."""
    db_firestore = firestore.client()
    users = db_firestore.collection('completedonboarding').stream()
    userids = []
    for user in users:
        user_data = user.to_dict()
        user_id = user_data['userId']
        userids.append(user_id)
    return userids

def fetch_user_preferences(user_id):
    """Fetch health and diet labels for a user from Firestore."""
    db_firestore = firestore.client()
    user_doc = db_firestore.collection('useronboarding').document(user_id).get()
    if user_doc.exists:
        user_data = user_doc.to_dict()
        health_labels = user_data.get('healthLabels', [])
        diet_labels = user_data.get('dietLabels', [])
        return health_labels, diet_labels
    else:
        return [], []  # Return empty lists if the document does not exist

def generate_and_store_recommendations():
    """Fetch interactions, generate recommendations based on user preferences, and store them in a JSON file."""
    userids = fetch_user_ids()
    all_recommendations = {}
    for user_id in userids:
        # Fetch user preferences
        health_labels, diet_labels = fetch_user_preferences(user_id)
        healthlabels = [label.lower() for label in health_labels]
        dietlabels = [dietlabel.lower() for dietlabel in diet_labels]
        
        # Fetch interactions for this user from Firestore
        db_firestore = firestore.client()
        interactions = db_firestore.collection('interactions').where('user_id', '==', user_id).stream()
        
        interaction_data = [interaction.to_dict() for interaction in interactions]
        if interaction_data:  # Only proceed if there is any interaction data
            interaction_df = pd.DataFrame(interaction_data)
            # Now provide healthLabels and dietLabels to the recommend_recipes function
            recommendations, names = recommend_recipes(df, interaction_df, healthlabels, dietlabels)
            all_recommendations[user_id] = recommendations
        # If there are no interactions, do not add the user to the all_recommendations dictionary

    # Only write to the JSON file if there are recommendations to write
    if all_recommendations:
        # Store the recommendations in a JSON file
        with open('user_recommendations.json', 'w') as json_file:
            json.dump(all_recommendations, json_file, indent=4)
        logging.debug("Saved recommendations to JSON file.")
    else:
        logging.debug("No recommendations to save. Skipping file write.")

def run_scheduler():
    """Setup and run the scheduler."""
    schedule.every(4).hours.do(generate_and_store_recommendations)

    while True:
        schedule.run_pending()
        time.sleep(1)

if __name__ == '__main__':
    generate_and_store_recommendations()
    run_scheduler()
