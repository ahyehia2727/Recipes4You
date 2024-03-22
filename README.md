This is a recipe recommendation system using data from Edamam's Recipe API.


To run this application:

Have node js installed (verify using node -v)

Install and create expo app (npx create-expo-app)

Add all files under this repository's 'recipes4u' directory to your expo directory

Get as much data as you can from Edamam's Recipe API (the more the better to see effectiveness of recommendation algorithm)

Install mongodb and insert this data into a mongodb database 'Recipes'

run adjustNutrients.js

run updaterecipeschema.js (add this line: "recipe.reviews": recipe.recipe.reviews || [] if you would also like reviews in the application)

run randomizelikedislikecook.js if you would like to get a high number of interactions

Create a mongodb database 'Ingredients'

run ingredients.js and upload the json file data created to your new database(may need some preprocessing you can use ingtolowercase.js and changeingredientxtoy.js before running this file) 

run pyt.py

Install firebase and set it up in a firebaseconfig.js file under your expo directory


run these commands in your main project's root directory:

node quickandeasy.js

node searchBackend.js

node makeitagain.js

node mlserver.js

node interactionslistener.js

node ingredientsBackend.js

node similarrecipes.js

node calorietracking.js

node viewrecipes.js

node proteinpowerhouses.js

node leanandgreen.js

node asiandelights.js

node mediterraneanclassics.js

node foryourdiet.js

node popularRecipes.js

node cheatDay.js

py recommendationalgorithm.py (runs every 4 hours, to see its effect immediately, make some interactions (like,save) then run the command and sign in to the application again)

py recommendationalgorithmforsearch.py

py similarrecipes.py


replace your.network.ip.address in the expo directory's files with your local network ip address

then finally in your expo directory run npx expo start
scan the qr code from your device and test it out!!
