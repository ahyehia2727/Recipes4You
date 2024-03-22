const express = require('express');
const mongoose = require('mongoose');
const fs = require('fs').promises; // Ensure fs promises is included for file operations
const app = express();
const port = 3004;

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

app.post('/get-recommendations', async (req, res) => {
    try {
        // Extract user ID and healthLabels from the request body
        const { userId, healthLabels, goal } = req.body;

        // Base query object
        let query = {};

        // Modify the query to filter by healthLabels if provided
        if (healthLabels && healthLabels.length) {
            query['recipe.healthLabels'] = { $all: healthLabels };
        }

        // Check if there's a user-specific recommendation list
        const data = await fs.readFile('user_recommendations.json', 'utf8');
        const recommendations = JSON.parse(data);

        let recipes;

        if (recommendations[userId]) {
            // If user-specific recommendations exist, filter by URLs
            const recipeUrls = recommendations[userId];
            query['recipe.url'] = { $in: recipeUrls };

            recipes = await Recipe.find(query).lean();
        } else {
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
            recipes = await Recipe.aggregate([
                { $match: query }, // Ensure recipes match health labels if provided
                { $sample: { size: 25 } }
            ]);
        }

        res.json(recipes.map(r => r.recipe)); // Return only the recipe details
    } catch (error) {
        console.error('Error processing request:', error);
        res.status(500).send('Error processing request');
    }
});

app.listen(port, () => {
    console.log(`Node.js server listening on port ${port}`);
});
