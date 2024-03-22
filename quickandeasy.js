const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3001;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Recipes', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

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

// Route to get quick and easy recipes that match certain health labels
app.post('/quickandeasy', async (req, res) => {
  try {
    // Extract healthLabels from query parameters. Expecting a comma-separated list.
// Extract healthLabels from query parameters. Expecting a comma-separated list.
const healthLabels = req.body

    const matchCriteria = {
      "recipe.totalTime": { $lt: 15, $gt: 0 }
    };

    // If healthLabels are provided, add them to the match criteria
    if (healthLabels.length > 0) {
      matchCriteria["recipe.healthLabels"] = { $all: healthLabels };
    }

    const recipes = await Recipe.aggregate([
      { $match: matchCriteria },
      { $limit: 25 }
    ]);
    res.json(recipes.map(r => r.recipe));
  } catch (error) {
    res.status(500).send(error.toString());
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
