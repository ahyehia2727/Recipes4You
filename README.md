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

then finally in your expo directory run npx expo start, 
scan the qr code from your device and test it out!!

How to use the app:
Sign up, you will get a verification email, verify your email and sign in.

Enter your allergies in the first page, then your diet restrictions, and then finally your physical metrics.

First tab is the Home page for users to scroll through until they find what they like. Second tab is the search screen to search for recipes (your allergies are preselected in Restrictions). Third tab is your shopping list for memory purposes where you can search for ingredients to add at the top. Final tab is your nutritional tracking with profile actions.

For the home page, all categories already take care of your allergies or diet restrictions and ofcourse click on a recipe to view it. From the recipe details page, you can like, dislike,save or see reviews and review the recipe. The number displayed on the top right is the number of times it was cooked. 

Then if you see you do not have a certain ingredient in the recipe you are viewing, click the button 'Don't have these ingredients'. Then select the ingredients you do not have and you can add them to your shopping list. Then click 'Find similar recipes' to find recipes without the selected ingredients, and click on it if you would like to view it ofcourse. Now go to the shopping list tab and verify your ingredients are added and you can search to add more at the top. Click 'Done' to view only the shopping list then click the 'Filter' button if you want to see only certain categories of ingredients displayed. click the reset button to remove any filters.

Now if you would like to cook the recipe, click on 'Start Cooking' at the bottom of the recipe details page. Then keep clicking the next step until the done button appears and confirm you have cooked this recipe. From here, if you go to tab 4 if you go to the bottom to the 'Cooked' button that recipe will be there. Now if you scroll up that same recipe will appear under 'Cooked Recipes', click on it and log your consumption in serving or gram. You can then go to manual entries and log some consumption outside the app by clicking 'Add Entry'. Click 'Reset Daily Consumption' to reset everything.

Then, for the search it is very simple, select the filters you want to apply, sort it however you want, verify the restrictions have your allergies and diet restrictions preselected, then search. If a recipe interests, click on it.

Finally, if you would like to see how the algorithm works, make some interactions: like a recipe or two, cook it, or even just view it! Then run py recommendationalgorithm.py and sign out from tab 4 and sign in again to see what recipes have been recommended.
