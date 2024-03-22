const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const app = express();
const port = 3007;

// MongoDB connection URL - update this with your connection string
mongoose.connect('mongodb://localhost:27017/Recipes');

const { Schema } = mongoose;
const reviewSchema = new mongoose.Schema({
  user_id: String,
  review_text: String,
  review_sentiment: Number,
  timestamp: { type: Date, default: Date.now },
}, { _id: false });

const ingredientSchema = new Schema({
  text: String,
  quantity: Number,
  measure: String,
  food: String,
  weight: Number,
  foodCategory: String,
  foodId: String,
  image: String
}, { _id: false });

const nutrientSchema = new Schema({
  label: String,
  quantity: Number,
  unit: String
}, { _id: false });

const digestSubSchema = new Schema({
  label: String,
  tag: String,
  schemaOrgTag: String,
  total: Number,
  hasRDI: Boolean,
  daily: Number,
  unit: String,
  sub: [nutrientSchema]
}, { _id: false });

const recipeDetailsSchema = new Schema({
  uri: String,
  label: String,
  image: String,
  source: String,
  url: String,
  shareAs: String,
  yield: Number,
  dietLabels: [String],
  healthLabels: [String],
  cautions: [String],
  ingredientLines: [String],
  ingredients: [ingredientSchema],
  calories: Number,
  totalWeight: Number,
  totalTime: Number,
  cuisineType: [String],
  mealType: [String],
  dishType: [String],
  totalNutrients: Schema.Types.Mixed,
  totalDaily: Schema.Types.Mixed,
  digest: [digestSubSchema],
  instructionLines: [String],
  cookCount: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  dislikesCount: { type: Number, default: 0 },
  cosineSimilarity: { type: Number, default: 0 },
  reviews: [reviewSchema]
}, { _id: false });

const mainRecipeSchema = new Schema({
  recipe: recipeDetailsSchema
});

const Recipe = mongoose.model('Recipe', mainRecipeSchema);

app.use(express.json());

app.post('/get-similar-recipes', async (req, res) => {
    try {
        // The request body should contain a 'label' field and an 'excludedIngredients' field
        const { label, excludedIngredients } = req.body;
        if (!label) {
            return res.status(400).send('Request body must contain a label field');
        }

        // Optionally handle the case where excludedIngredients is not provided or not an array
        if (!Array.isArray(excludedIngredients)) {
            return res.status(400).send('Request body must contain an excludedIngredients field as an array');
        }

        // Call the Flask app's endpoint with the recipe label
        const response = await axios.post('http://localhost:5001/get-similar-recipes', { label });
        const recipeUrls = response.data; // These are the URLs of similar recipes

        const urls = recipeUrls.map(item => item.url);

        // Use the extracted URLs in your MongoDB query
        let recipes = await Recipe.find({
          "recipe.url": { $in: urls }
        }).lean(); // Use .lean() for faster reads if you don't need mongoose docs features

        recipes.forEach(recipe => {
          const matchedData = recipeUrls.find(r => r.url === recipe.recipe.url);
          if (matchedData) {
              recipe.recipe.cosineSimilarity = matchedData.cosineSimilarity;
          }
      });

        // Filter recipes to exclude any that contain the excluded ingredients
        recipes = recipes.filter(recipe => {
            // Check if any of the recipe's ingredients are in the excludedIngredients list
            const containsExcludedIngredient = recipe.recipe.ingredients.some(ingredient => 
                excludedIngredients.includes(ingredient.food.toLowerCase())
            );
            return !containsExcludedIngredient;
        });

        recipes.sort((a, b) => b.recipe.cosineSimilarity - a.recipe.cosineSimilarity);

        // Limit the number of recipes to 30 if there are more than that
        if (recipes.length > 30) {
          recipes = recipes.slice(0, 30);
        }

        res.json(recipes.map(r => r.recipe)); // Return only the recipe details
    } catch (error) {
        console.error('Error proxying request:', error);
        res.status(500).send('Error proxying request');
    }
});

app.listen(port, () => {
    console.log(`Node.js server listening on port ${port}`);
});
