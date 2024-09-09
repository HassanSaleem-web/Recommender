import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.neighbors import NearestNeighbors
import joblib
import numpy as np

# Load the dataset and skip problematic lines
df = pd.read_csv(r'C:\Users\husse\Book Reccomendation\books.csv', on_bad_lines='skip')

# Print the number of rows loaded to ensure data is read correctly
print(f"Loaded dataset with {len(df)} rows.")

# Drop any rows with missing values (optional, depending on data quality)
df.dropna(inplace=True)

# Convert publication date to datetime
df['publication_date'] = pd.to_datetime(df['publication_date'], errors='coerce')

# Encode categorical features like language and publisher
label_encoder = LabelEncoder()
df['language_code'] = label_encoder.fit_transform(df['language_code'])
df['publisher'] = label_encoder.fit_transform(df['publisher'])

# Select features to use in the model
features = ['average_rating', 'language_code', '  num_pages', 'ratings_count', 'text_reviews_count']
X = df[features]

# Split the data into training and testing sets
X_train, X_test = train_test_split(X, test_size=0.2, random_state=42)

# Train a content-based NearestNeighbors model
content_model = NearestNeighbors(metric='cosine', algorithm='brute')
content_model.fit(X_train)

# Save the model to a file
model_path = r'C:\Users\husse\Book Reccomendation\content_model.pkl'
joblib.dump(content_model, model_path)

print(f'Model trained and saved to {model_path}')

# Test the model on the test set with explanations
def test_model_with_explanations(content_model, X_test, df):
    # Let's pick a few random books from the test set and find their nearest neighbors
    np.random.seed(42)
    random_books = X_test.sample(5)
    
    for idx, book in random_books.iterrows():
        # Find the nearest neighbors for this book
        distances, indices = content_model.kneighbors([book])
        
        # Get the original book details
        selected_book = df.iloc[idx]
        
        # Print the selected book details
        print(f"\nSelected Book: {selected_book['title']} by {selected_book['authors']}")
        print(f"Average Rating: {selected_book['average_rating']}, Language Code: {selected_book['language_code']}, Ratings Count: {selected_book['ratings_count']}, Text Reviews Count: {selected_book['text_reviews_count']}")
        
        # Print recommended similar books with reasons
        print("Recommended similar books:")
        for i in range(len(indices[0])):
            recommended_book_idx = indices[0][i]
            recommended_book = df.iloc[recommended_book_idx]
            print(f"\n{i+1}. {recommended_book['title']} by {recommended_book['authors']}")
            print(f"Reason for recommendation:")
            print(f"- Average Rating: {recommended_book['average_rating']} (Compared to {selected_book['average_rating']})")
            print(f"- Language Code: {recommended_book['language_code']} (Compared to {selected_book['language_code']})")
            print(f"- Ratings Count: {recommended_book['ratings_count']} (Compared to {selected_book['ratings_count']})")
            print(f"- Text Reviews Count: {recommended_book['text_reviews_count']} (Compared to {selected_book['text_reviews_count']})")

# Run the test with explanations
test_model_with_explanations(content_model, X_test, df)
