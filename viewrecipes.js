const express = require('express');
const mongoose = require('mongoose');
const app = express();
const port = 3009; // Adjusted to match the port in the frontend fetch request

// MongoDB connection URL - update this with your actual connection string
mongoose.connect('mongodb://localhost:27017/Recipes', { useNewUrlParser: true, useUnifiedTopology: true });

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
  reviews: [reviewSchema]
}, { _id: false });

const mainRecipeSchema = new Schema({
  recipe: recipeDetailsSchema
});

const Recipe = mongoose.model('Recipe', mainRecipeSchema);

app.use(express.json());

app.post('/get-recipes', async (req, res) => {
    try {
        const { recipeIds } = req.body;

        // Validate recipeIds is provided and is an array
        if (!recipeIds || !Array.isArray(recipeIds)) {
            return res.status(400).send('Invalid request: recipeIds array is required');
        }

        // Find recipes by their IDs
        const recipes = await Recipe.find({
            'recipe.label': { $in: recipeIds }
        }).lean(); // Using .lean() for performance, since we only need the JSON data
        console.log(recipes)
        res.json(recipes.map(r => r.recipe)); // Assuming each recipe document matches the expected structure in the frontend
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).send('Error processing request');
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
