# Recipe Finder with Ingredient Search

A modern web application that helps users find recipes based on available ingredients, featuring fuzzy matching, synonym expansion, and user ratings.

## Features

- **Ingredient-Based Search**: Input ingredients you have to find matching recipes
- **Synonym Expansion**: Automatically handles ingredient synonyms for better results
- **Fuzzy Matching**: Corrects minor spelling errors in ingredient names
- **Recipe Ranking**: Recipes are ranked based on user ratings and reviews
- **User Feedback**: Incorporates user ratings and reviews to improve recommendations

## Technologies Used

- **Backend**: Flask (Python)
- **Frontend**: HTML5, CSS3, JavaScript
- **Libraries**:
  - NLTK for synonym expansion
  - FuzzyWuzzy for fuzzy string matching
  - Bootstrap for responsive design
  - Font Awesome for icons

## Setup Instructions

1. Install Python requirements:
   ```
   pip install -r requirements.txt
   ```

2. Run the Flask application:
   ```
   python app.py
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:5000
   ```

## Usage

1. Enter ingredients you have in your kitchen
2. Click "Add" or press Enter to add each ingredient
3. Click "Find Recipes" to search for matching recipes
4. View recipe details by clicking "View Recipe"
5. Rate recipes and provide feedback to improve recommendations

## Project Structure

- `app.py`: Main Flask application
- `templates/index.html`: Main webpage template
- `static/style.css`: CSS styles
- `static/script.js`: Frontend JavaScript
- `requirements.txt`: Python dependencies
