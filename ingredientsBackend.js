const express = require('express');
const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/Ingredients', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected...'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schema and Model
const ingredientSchema = new mongoose.Schema({
  food: String,
  foodCategory: String,
  image: String
}, { timestamps: true }); // Ensure indexing for text search

// Ensure the schema has a text index on the 'food' field
ingredientSchema.index({ food: 'text' });

const Ingredient = mongoose.model('Ingredient', ingredientSchema);

// Set up Express app
const app = express();
const port = 3006;

// Middleware to parse JSON bodies
app.use(express.json());

// Search endpoint
app.get('/search', async (req, res) => {
  try {
    const { query } = req.query; // Extract search query from URL query parameters
    if (!query) {
      return res.status(400).send({ message: 'Query parameter is missing' });
    }

    // Perform text search on the 'food' field, sort by relevance, and limit to 5 results
    const results = await Ingredient.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } } // Project the textScore to sort by
    ).sort(
      { score: { $meta: 'textScore' } } // Sort by textScore (relevance)
    ).limit(5); // Limit to 5 results

    res.status(200).json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).send({ message: 'Internal server error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on ${port}`);
});
