document.addEventListener('DOMContentLoaded', function() {
    const ingredients = new Set();
    const ingredientInput = document.getElementById('ingredientInput');
    const ingredientTags = document.getElementById('ingredientTags');
    const addIngredientBtn = document.getElementById('addIngredient');
    const searchButton = document.getElementById('searchButton');
    const recipeResults = document.getElementById('recipeResults');
    const recipeModal = new bootstrap.Modal(document.getElementById('recipeModal'));
    let currentRecipeId = null;

    // Add ingredient when clicking the add button
    addIngredientBtn.addEventListener('click', addIngredient);

    // Add ingredient when pressing Enter
    ingredientInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addIngredient();
        }
    });

    // Search for recipes
    searchButton.addEventListener('click', searchRecipes);

    function addIngredient() {
        const ingredient = ingredientInput.value.trim().toLowerCase();
        if (ingredient && !ingredients.has(ingredient)) {
            ingredients.add(ingredient);
            const tag = createIngredientTag(ingredient);
            ingredientTags.appendChild(tag);
            ingredientInput.value = '';
        }
    }

    function createIngredientTag(ingredient) {
        const tag = document.createElement('span');
        tag.className = 'ingredient-tag';
        tag.innerHTML = `${ingredient} <span class="remove">&times;</span>`;
        
        tag.querySelector('.remove').addEventListener('click', () => {
            ingredients.delete(ingredient);
            tag.remove();
        });
        
        return tag;
    }

    async function searchRecipes() {
        if (ingredients.size === 0) {
            alert('Please add at least one ingredient!');
            return;
        }

        try {
            searchButton.disabled = true;
            searchButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Searching...';
            
            const response = await fetch('/search', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ingredients: Array.from(ingredients)
                })
            });

            const recipes = await response.json();
            displayRecipes(recipes);
        } catch (error) {
            console.error('Error searching recipes:', error);
            recipeResults.innerHTML = '<div class="alert alert-danger">Error searching recipes. Please try again.</div>';
        } finally {
            searchButton.disabled = false;
            searchButton.innerHTML = '<i class="fas fa-search"></i> Find Recipes';
        }
    }

    function displayRecipes(recipes) {
        recipeResults.innerHTML = '';
        
        if (recipes.length === 0) {
            recipeResults.innerHTML = '<div class="alert alert-info">No recipes found with these ingredients. Try adding different ingredients!</div>';
            return;
        }

        const resultsHeader = document.createElement('h2');
        resultsHeader.className = 'mb-4';
        resultsHeader.textContent = `Found ${recipes.length} Matching Recipes`;
        recipeResults.appendChild(resultsHeader);

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.className = 'recipe-card';
            card.innerHTML = `
                <div class="row">
                    <div class="col-md-8">
                        <h3>${recipe.name}</h3>
                        <div class="recipe-info">
                            <span class="badge bg-primary me-2">
                                <i class="fas fa-clock"></i> ${recipe.cooking_time}
                            </span>
                            <span class="badge bg-secondary me-2">
                                <i class="fas fa-signal"></i> ${recipe.difficulty}
                            </span>
                            <span class="badge bg-success">
                                <i class="fas fa-percentage"></i> Match: ${recipe.match_percentage}
                            </span>
                        </div>
                        <div class="match-info mt-2 mb-2">
                            <small class="text-muted">
                                Matched ${recipe.matched_ingredients} out of ${recipe.total_input_ingredients} ingredients
                            </small>
                        </div>
                        <div class="ingredients-preview">
                            <small class="text-muted">
                                ${recipe.ingredients.slice(0, 4).join(', ')}
                                ${recipe.ingredients.length > 4 ? '...' : ''}
                            </small>
                        </div>
                    </div>
                    <div class="col-md-4 text-md-end">
                        <button class="btn btn-primary view-recipe" data-recipe-id="${recipe.id}">
                            View Recipe
                        </button>
                    </div>
                </div>
            `;

            card.querySelector('.view-recipe').addEventListener('click', () => {
                showRecipeModal(recipe);
            });

            recipeResults.appendChild(card);
        });
    }

    function showRecipeModal(recipe) {
        currentRecipeId = recipe.id;
        const modal = document.getElementById('recipeModal');
        modal.querySelector('.modal-title').textContent = recipe.name;
        
        const modalBody = modal.querySelector('.modal-body');
        modalBody.innerHTML = `
            <div class="recipe-details mb-4">
                <div class="d-flex justify-content-between mb-3">
                    <span class="badge bg-primary">
                        <i class="fas fa-clock"></i> ${recipe.cooking_time}
                    </span>
                    <span class="badge bg-secondary">
                        <i class="fas fa-signal"></i> ${recipe.difficulty}
                    </span>
                </div>
                ${recipe.rating > 0 ? `
                <div class="rating-display mb-3">
                    <div class="stars">
                        ${getStarRating(recipe.rating)}
                    </div>
                    <small class="text-muted">(${recipe.rating.toFixed(1)} average from ${recipe.reviews.length} reviews)</small>
                </div>
                ` : ''}
            </div>
            
            <h5><i class="fas fa-list"></i> Ingredients:</h5>
            <ul class="ingredients-list mb-4">
                ${recipe.ingredients.map(ing => `
                    <li>
                        <i class="fas fa-check text-success me-2"></i>
                        ${ing}
                    </li>
                `).join('')}
            </ul>
            
            <h5><i class="fas fa-utensils"></i> Instructions:</h5>
            <ol class="procedure-list">
                ${recipe.procedure.map(step => `
                    <li class="mb-3">
                        <div class="procedure-step">
                            ${step}
                        </div>
                    </li>
                `).join('')}
            </ol>

            ${recipe.reviews.length > 0 ? `
            <h5><i class="fas fa-comments"></i> Reviews:</h5>
            <div class="reviews-list mb-4">
                ${recipe.reviews.map(review => `
                    <div class="review-item">
                        <div class="stars">
                            ${getStarRating(review.rating)}
                        </div>
                        <p class="review-text">${review.feedback}</p>
                        <small class="text-muted">${review.date}</small>
                    </div>
                `).join('')}
            </div>
            ` : ''}

            <div class="rating-section mt-4">
                <h5><i class="fas fa-star"></i> Rate this Recipe</h5>
                <div class="rating-input mb-3">
                    <div class="stars" id="ratingStars">
                        ${getStarRating(0, true)}
                    </div>
                </div>
                <div class="form-group">
                    <label for="feedbackText" class="form-label">Your Feedback:</label>
                    <textarea class="form-control" id="feedbackText" rows="3" placeholder="Share your experience with this recipe..."></textarea>
                </div>
                <button class="btn btn-primary mt-3" onclick="submitReview()">Submit Review</button>
            </div>
        `;

        // Initialize rating stars functionality
        initializeRatingStars();
        
        recipeModal.show();
    }

    function initializeRatingStars() {
        const ratingStars = document.getElementById('ratingStars');
        const stars = ratingStars.querySelectorAll('i');
        
        stars.forEach((star, index) => {
            star.addEventListener('mouseover', () => {
                // Highlight stars on hover
                for (let i = 0; i <= index; i++) {
                    stars[i].classList.remove('far');
                    stars[i].classList.add('fas');
                }
            });
            
            star.addEventListener('mouseout', () => {
                // Reset stars if no rating selected
                if (!ratingStars.dataset.rating) {
                    stars.forEach(s => {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    });
                }
            });
            
            star.addEventListener('click', () => {
                // Set rating
                const rating = index + 1;
                ratingStars.dataset.rating = rating;
                
                // Update star display
                stars.forEach((s, i) => {
                    if (i <= index) {
                        s.classList.remove('far');
                        s.classList.add('fas');
                    } else {
                        s.classList.remove('fas');
                        s.classList.add('far');
                    }
                });
            });
        });
    }

    async function submitReview() {
        const ratingStars = document.getElementById('ratingStars');
        const rating = parseInt(ratingStars.dataset.rating || '0');
        const feedback = document.getElementById('feedbackText').value.trim();
        
        if (!rating) {
            alert('Please select a rating before submitting.');
            return;
        }
        
        if (!feedback) {
            alert('Please provide some feedback about the recipe.');
            return;
        }
        
        try {
            const response = await fetch('/rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipe_id: currentRecipeId,
                    rating: rating,
                    feedback: feedback
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Thank you for your review!');
                recipeModal.hide();
                // Refresh the recipe list to show updated ratings
                searchRecipes();
            } else {
                alert('Error submitting review: ' + result.error);
            }
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        }
    }

    function getStarRating(rating, interactive = false) {
        const stars = [];
        for (let i = 1; i <= 5; i++) {
            const filled = i <= Math.round(rating);
            const starClass = filled ? 'fas fa-star' : 'far fa-star';
            if (interactive) {
                stars.push(`<i class="${starClass}" data-rating="${i}"></i>`);
            } else {
                stars.push(`<i class="${starClass}"></i>`);
            }
        }
        return stars.join('');
    }

    // Handle star rating clicks
    document.querySelector('.stars').addEventListener('click', function(e) {
        if (e.target.matches('i')) {
            const rating = parseInt(e.target.dataset.rating);
            const stars = this.querySelectorAll('i');
            
            stars.forEach((star, index) => {
                star.className = index < rating ? 'fas fa-star' : 'far fa-star';
            });
        }
    });

    // Handle rating submission
    document.querySelector('.submit-rating').addEventListener('click', async function() {
        const rating = document.querySelectorAll('.stars .fas').length;
        const review = document.querySelector('.modal-footer textarea').value;

        if (rating === 0) {
            alert('Please select a rating!');
            return;
        }

        try {
            const response = await fetch('/rate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipe_id: currentRecipeId,
                    rating: rating,
                    review: review
                })
            });

            const result = await response.json();
            if (result.success) {
                alert('Thank you for your rating!');
                recipeModal.hide();
                // Refresh the recipe list to show updated ratings
                searchRecipes();
            }
        } catch (error) {
            console.error('Error submitting rating:', error);
        }
    });
});
