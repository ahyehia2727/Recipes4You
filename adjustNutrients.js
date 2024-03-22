const mongoose = require('mongoose');
const { Schema } = mongoose;

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
  
  const digestSubSchema = new Schema({
    label: String,
    tag: String,
    schemaOrgTag: String,
    total: Number,
    hasRDI: Boolean,
    daily: Number,
    unit: String
  }, { _id: false });

  const digestSchema = new Schema({
    label: String,
    tag: String,
    schemaOrgTag: String,
    total: Number,
    hasRDI: Boolean,
    daily: Number,
    unit: String,
    sub: [digestSubSchema]
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
    digest: [digestSchema],
    instructionLines: [String]
  }, { _id: false });
  
  const mainRecipeSchema = new Schema({
    recipe: recipeDetailsSchema
  });

const Recipe = mongoose.model('Recipe', mainRecipeSchema);

const adjustNutrients = async () => {
    try {
      // Connect to MongoDB
      await mongoose.connect('mongodb://localhost:27017/Recipes');
      console.log('MongoDB connected...');
  
      const recipes = await Recipe.find(); // Fetch a recipe
      for(const recipe of recipes){
      if (recipe && recipe.recipe.totalWeight > 0) {
        const ratio = recipe.recipe.yield / (recipe.recipe.totalWeight);
  
        // Convert to a plain JavaScript object to modify
        const recipeObj = recipe.toObject();
  
        for (const digest of recipeObj.recipe.digest) {
          if (digest.total) {
            digest.total *= ratio;
          }
          if (digest.sub) {
            for (const subdigest of digest.sub) {
              if (subdigest.total) {
                subdigest.total *= ratio;
              }
            }
          }
        }
  
        // Save the modified recipe back to the database
        recipe.set(recipeObj);
        await recipe.save();
  
      } else {
        console.log('No recipes found or totalWeight is 0.');
      }
    }
 } catch (error) {
      console.error('Error:', error);
    } finally {
      mongoose.disconnect();
    }
  };
  
  adjustNutrients();
  