const mongoose = require('mongoose');

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

const randomizeRecipeStats = async () => {
  try {
    const recipes = await Recipe.find({}); // Fetch all recipes

    for (let recipe of recipes) {
      // Generate random likeCount between 500 and 10000
      const likeCount = Math.floor(Math.random() * (10000 - 500 + 1)) + 500;
      // Randomize dislikeCount as 0.1 to 0.4 of likeCount
      const dislikeCount = Math.round(likeCount * (Math.random() * (0.25 - 0.1) + 0.1));
      // Randomize cookCount as 5 to 8 times likeCount
      const cookCount = Math.round(likeCount * (Math.random() * (8 - 5) + 5));

      // Update the recipe document with randomized counts
      recipe.recipe.likesCount = likeCount;
      recipe.recipe.dislikesCount = dislikeCount;
      recipe.recipe.cookCount = cookCount;

      await recipe.save();
    }

    console.log('Recipe stats have been randomized.');
  } catch (error) {
    console.error('An error occurred during processing:', error);
  }
};

// Call the function to start the randomization process
randomizeRecipeStats();