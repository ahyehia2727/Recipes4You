const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = 3008;

app.use(express.json()); // Middleware to parse JSON bodies

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

// New route for calculating nutrition based on servings or grams
app.post('/calculate', async (req, res) => {
  const { recipeName, unit, amount } = req.body;

  try {
    // Find the recipe by name
    const recipe = await Recipe.findOne({ "recipe.label": recipeName });

    if (!recipe) {
      return res.status(404).send({ message: 'Recipe not found' });
    }

    // Extract needed properties from the found recipe
    const { calories, totalWeight, digest } = recipe.recipe;

    let caloriesConsumed, carbsConsumed, proteinConsumed, fatsConsumed, ratio;

    if (unit === 'serving') {
      ratio = amount / recipe.recipe.yield; // Assuming 'yield' represents servings
    } else if (unit === 'gram') {
      ratio = amount / totalWeight;
    } else {
      return res.status(400).send({ message: 'Invalid unit' });
    }

    // Calculate the consumed nutrients based on the ratio
    caloriesConsumed = calories * ratio;
    carbsConsumed = (digest.find(d => d.tag === "CHOCDF")?.total || 0) * ratio; // Assuming 'CHOCDF' tag for carbs
    proteinConsumed = (digest.find(d => d.tag === "PROCNT")?.total || 0) * ratio; // Assuming 'PROCNT' tag for protein
    fatsConsumed = (digest.find(d => d.tag === "FAT")?.total || 0) * ratio; // Assuming 'FAT' tag for fats

    res.send({
      caloriesConsumed: caloriesConsumed.toFixed(2),
      carbsConsumed: carbsConsumed.toFixed(2),
      proteinConsumed: proteinConsumed.toFixed(2),
      fatsConsumed: fatsConsumed.toFixed(2),
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Server error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
