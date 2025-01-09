from flask import Flask, render_template, request, jsonify
from fuzzywuzzy import fuzz
import json
import nltk
from nltk.corpus import wordnet
import os
from datetime import datetime

app = Flask(__name__)

# Download required NLTK data
nltk.download('wordnet')

# Load the recipe dataset
def load_recipes():
    try:
        with open('recipes_data.json', 'r') as f:
            recipes_data = json.load(f)
        
        # Process recipes into our format
        processed_recipes = []
        for idx, (name, details) in enumerate(recipes_data.items()):
            processed_recipe = {
                "id": idx + 1,
                "name": name,
                "ingredients": details["ingredients"],
                "procedure": details["procedure"],
                "cooking_time": details["cooking_time"],
                "difficulty": details["difficulty"],
                "rating": details.get("rating", 0),  # Initialize with 0
                "reviews": details.get("reviews", [])
            }
            processed_recipes.append(processed_recipe)
        return processed_recipes
    except Exception as e:
        print(f"Error loading recipes: {e}")
        return []

# Load recipes on startup
recipes = load_recipes()

# Create an ingredient index for faster searching
ingredient_index = {}
for recipe in recipes:
    for ingredient in recipe["ingredients"]:
        if ingredient not in ingredient_index:
            ingredient_index[ingredient] = []
        ingredient_index[ingredient].append(recipe["id"])

def get_synonyms(word):
    synonyms = set()
    for syn in wordnet.synsets(word):
        for lemma in syn.lemmas():
            synonyms.add(lemma.name().lower())
    return list(synonyms)

def fuzzy_match_ingredients(user_ingredients, recipe_ingredients, threshold=80):
    matched_ingredients = set()
    
    for user_ing in user_ingredients:
        user_ing_words = user_ing.lower().split()
        # Get synonyms for each word in the ingredient
        all_variants = set(user_ing_words)
        for word in user_ing_words:
            all_variants.update(get_synonyms(word))
        
        for recipe_ing in recipe_ingredients:
            if recipe_ing in matched_ingredients:
                continue
                
            recipe_ing_lower = recipe_ing.lower()
            # Check if any variant of the user ingredient matches
            for variant in all_variants:
                if variant in recipe_ing_lower or fuzz.partial_ratio(variant, recipe_ing_lower) > threshold:
                    matched_ingredients.add(recipe_ing)
                    break
    
    return len(matched_ingredients)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/search', methods=['POST'])
def search_recipes():
    data = request.get_json()
    ingredients = data.get('ingredients', [])
    
    if not ingredients:
        return jsonify([])
    
    # Calculate minimum required matches (60% of input ingredients)
    min_matches_required = max(1, round(len(ingredients) * 0.6))
    
    # Get candidate recipes using the ingredient index
    candidate_recipe_ids = set()
    for ingredient in ingredients:
        for recipe_ing, recipe_ids in ingredient_index.items():
            if fuzz.partial_ratio(ingredient.lower(), recipe_ing.lower()) > 80:
                candidate_recipe_ids.update(recipe_ids)
    
    # Process and rank recipes
    ranked_recipes = []
    for recipe_id in candidate_recipe_ids:
        recipe = recipes[recipe_id - 1]  # Adjust for 0-based indexing
        matches = fuzzy_match_ingredients(ingredients, recipe['ingredients'])
        
        # Only include recipes that match at least 60% of input ingredients
        if matches >= min_matches_required:
            match_percentage = (matches / len(ingredients)) * 100
            ranked_recipes.append({
                'recipe': recipe,
                'score': match_percentage,
                'matched_count': matches
            })
    
    # Sort by score
    ranked_recipes.sort(key=lambda x: (x['score'], -len(x['recipe']['ingredients'])), reverse=True)
    
    # Add match percentage to recipe output
    for item in ranked_recipes:
        item['recipe']['match_percentage'] = f"{item['score']:.1f}%"
        item['recipe']['matched_ingredients'] = item['matched_count']
        item['recipe']['total_input_ingredients'] = len(ingredients)
    
    return jsonify([r['recipe'] for r in ranked_recipes[:10]])

@app.route('/rate', methods=['POST'])
def rate_recipe():
    data = request.get_json()
    recipe_id = data.get('recipe_id')
    rating = data.get('rating')
    feedback = data.get('feedback', '')
    
    if not recipe_id or not rating or not feedback:
        return jsonify({
            'success': False,
            'error': 'Missing required fields'
        })
    
    if not (1 <= rating <= 5):
        return jsonify({
            'success': False,
            'error': 'Rating must be between 1 and 5'
        })
    
    # Update recipe rating and add review
    for recipe in recipes:
        if recipe['id'] == recipe_id:
            # Create new review
            review = {
                'rating': rating,
                'feedback': feedback,
                'date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
            recipe['reviews'].append(review)
            
            # Update average rating
            total_ratings = sum(review['rating'] for review in recipe['reviews'])
            recipe['rating'] = total_ratings / len(recipe['reviews'])
            
            # Save updated recipes to file
            try:
                save_recipes_to_file()
                return jsonify({'success': True})
            except Exception as e:
                return jsonify({
                    'success': False,
                    'error': f'Error saving review: {str(e)}'
                })
    
    return jsonify({
        'success': False,
        'error': 'Recipe not found'
    })

def save_recipes_to_file():
    """Save the current state of recipes back to the JSON file"""
    recipes_data = {}
    for recipe in recipes:
        recipes_data[recipe['name']] = {
            'ingredients': recipe['ingredients'],
            'procedure': recipe['procedure'],
            'cooking_time': recipe['cooking_time'],
            'difficulty': recipe['difficulty'],
            'rating': recipe['rating'],
            'reviews': recipe['reviews']
        }
    
    with open('recipes_data.json', 'w') as f:
        json.dump(recipes_data, f, indent=4)

if __name__ == '__main__':
    app.run(debug=True)
