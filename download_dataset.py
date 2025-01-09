import requests
import json
import os

def download_dataset():
    url = "https://raw.githubusercontent.com/rahulcodewiz/recipes-search-engine/refs/heads/master/dataset/recipes_raw_nosource_epi.json"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        # Save the dataset locally
        with open('recipes_dataset.json', 'w') as f:
            json.dump(data, f)
        
        # Print dataset information
        print(f"Total recipes: {len(data)}")
        print("\nSample recipe structure:")
        print(json.dumps(data[0], indent=2))
        
        # Print some statistics
        categories = set()
        total_ingredients = 0
        
        for recipe in data:
            total_ingredients += len(recipe.get('ingredients', []))
            categories.update(recipe.get('categories', []))
        
        print(f"\nDataset Statistics:")
        print(f"Average ingredients per recipe: {total_ingredients/len(data):.2f}")
        print(f"Number of unique categories: {len(categories)}")
        print("\nSample categories:", list(categories)[:10])
        
    else:
        print(f"Failed to download dataset. Status code: {response.status_code}")

if __name__ == "__main__":
    download_dataset()
