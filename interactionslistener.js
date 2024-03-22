const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const port = 3005;

app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/Recipes', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB...'))
  .catch(err => console.error('Could not connect to MongoDB...', err));

  const { Schema } = mongoose;

  const reviewSchema = new mongoose.Schema({
      user_email: String,
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

    app.patch('/api/recipes/interact', async (req, res) => {
      const { label, type, action, adjustOpposite } = req.body;
  
      try {
          const filter = { "recipe.label": label };
          let update = {};
  
          if (type === 'cook' && action === 'add') {
              // Directly handle 'cook' action
              update = { $inc: { "recipe.cookCount": 1 } };
          } else if ((type === 'like' || type === 'dislike') && (action === 'add' || action === 'remove')) {
              // Handle like/dislike increment or decrement
              const increment = action === 'add' ? 1 : -1;
              const fieldToUpdate = `recipe.${type === 'like' ? 'likesCount' : 'dislikesCount'}`;
              update = { $inc: { [fieldToUpdate]: increment } };
  
              if (adjustOpposite) {
                  const oppositeField = `recipe.${type === 'like' ? 'dislikesCount' : 'likesCount'}`;
                  update.$inc[oppositeField] = -1;
              }
          } else if (action === 'switchToLike' || action === 'switchToDislike') {
              // Handle switching between like and dislike
              update = { 
                  $inc: { 
                      "recipe.likesCount": action === 'switchToLike' ? 1 : -1, 
                      "recipe.dislikesCount": action === 'switchToLike' ? -1 : 1 
                  } 
              };
          } else {
              return res.status(400).json({ message: 'Invalid action type' });
          }
  
          await Recipe.findOneAndUpdate(filter, update, { new: true });
          res.status(200).json({ message: `Recipe ${type} ${action} successfully` });
      } catch (error) {
          console.error('Error updating recipe interaction:', error);
          res.status(500).json({ error: 'Error updating recipe interaction', details: error });
      }
  });
          
  
  // Route to add a review based on recipe label
  app.post('/api/recipes/review', async (req, res) => {
    const { label, user_email, review_text, review_sentiment } = req.body; // Expect these in the request body
  
    const review = {
      user_email,
      review_text,
      review_sentiment,
      timestamp: new Date()
    };
  
    try {
      const filter = { "recipe.label": label };
      await Recipe.findOneAndUpdate(filter, { $push: { "recipe.reviews": review } });
      res.status(200).json({ message: 'Review added successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Error adding review', details: error });
    }
  });  

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
