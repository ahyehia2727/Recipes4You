const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs').promises; // Ensure fs promises is included for file operations
const app = express();
const port = 3014;

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
  reviews: [reviewSchema]
}, { _id: false });

const mainRecipeSchema = new Schema({
  recipe: recipeDetailsSchema
});

const Recipe = mongoose.model('Recipe', mainRecipeSchema);

app.use(express.json());

app.post('/foryourdiet', async (req, res) => {
    try {
      const { goal,healthLabels } = req.body;
      let query = {};

      if (healthLabels && healthLabels.length) {
        query['recipe.healthLabels'] = { $all: healthLabels };
    }
  
      switch(goal) {
        case 'extreme_weight_loss':
          query['recipe.dietLabels'] = { $all: ["Low-Carb", "Low-Fat"] };
          break;
        case 'weight_loss':
          query['recipe.dietLabels'] = { $all: ["Low-Carb"] };
          break;
        case 'muscle_building':
          query['recipe.dietLabels'] = { $all: ["High-Protein"] };
          break;
      }
  
      // Fetch recipes that match the dietary goal with a limit of 25
      const recipes = await Recipe.aggregate([
        { $match: query },
        { $sample: { size: 35 } } // Randomly select up to 25 recipes that match the criteria
      ]);
  
      res.json(recipes.map(r => r.recipe)); // Return only the recipe details
    } catch (error) {
      console.error('Error processing request:', error);
      res.status(500).send('Error processing request');
    }
  });

  app.listen(port, () => {
    console.log(`Node.js server listening on port ${port}`);
});