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
    likesCount: { type: Number, default: 0 },
    dislikesCount: { type: Number, default: 0 },
    cookCount: { type: Number, default: 0 },
    reviews: [reviewSchema]
  }, { _id: false });
  
  const mainRecipeSchema = new Schema({
    recipe: recipeDetailsSchema
  });

const Recipe = mongoose.model('Recipe', mainRecipeSchema);

const updateIngredientFood = async (oldFoodName, newFoodName) => {
  try {
    const recipes = await Recipe.find({'recipe.ingredients.food': oldFoodName});

    for (let recipe of recipes) {
      // Flag to track if we've made any changes
      let hasChanged = false;

      // Check and update ingredients if needed
      recipe.recipe.ingredients.forEach(ingredient => {
        if (ingredient.food === oldFoodName) {
          ingredient.food = newFoodName;
          hasChanged = true;
        }
      });

      // Only save if changes were made
      if (hasChanged) {
        await recipe.save();
      }
    }

    console.log(`All instances of '${oldFoodName}' have been changed to '${newFoodName}'.`);
  } catch (error) {
    console.error('An error occurred during processing:', error);
  }
};

// Replace 'x' with the ingredient you want to change, and 'y' with the new ingredient name
updateIngredientFood('sweetpotatoe', 'sweet potatoe');
