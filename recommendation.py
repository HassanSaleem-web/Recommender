from flask import Flask, request, jsonify, render_template, send_from_directory
import requests
import os
import csv

app = Flask(__name__)

# Google Books API Key
api_key = ''

# Directory for uploading files
UPLOAD_FOLDER = 'uploads'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload directory exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Serve the main HTML page
@app.route('/')
def index():
    return render_template('main.html')

# Serve the recommendations HTML page
@app.route('/rec.html')
def recommendations():
    return render_template('rec.html')

# Serve static files (CSS, JS) from 'static' directory
@app.route('/static/<path:path>')
def send_static(path):
    return send_from_directory('static', path)

# Endpoint for fetching book data from Google Books API
@app.route('/fetch_book', methods=['GET'])
def fetch_book():
    book_id = request.args.get('bookId')
    url = f'https://www.googleapis.com/books/v1/volumes/{book_id}?key={api_key}'
    response = requests.get(url)

    if response.status_code == 200:
        data = response.json()
        volume_info = data.get('volumeInfo', {})
        attributes = {
            'average_rating': volume_info.get('averageRating', 'N/A'),
            'language_code': volume_info.get('language', 'N/A'),
            'num_pages': volume_info.get('pageCount', 'N/A'),
            'ratings_count': volume_info.get('ratingsCount', 'N/A'),
            'text_reviews_count': volume_info.get('textReviewsCount', 'N/A')
        }
        return jsonify(attributes)
    else:
        return jsonify({'error': 'Book not found'}), 404

# Endpoint to handle file upload and processing
@app.route('/upload', methods=['POST'])
def upload_file():
    if 'goodreads-file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['goodreads-file']

    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
    file.save(filepath)

    # Process the CSV file
    books = []
    with open(filepath, newline='', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            book = {
                "title": row['Title'],
                "authors": row['Author'],
                "average_rating": row['Average Rating'],
                "num_pages": row['Number of Pages'],
                "genres": row['Bookshelves'].split(', '),  # Assuming genres are stored in the "Bookshelves" column
            }
            books.append(book)

    # Example: Find common genres
    genres = {}
    for book in books:
        for genre in book['genres']:
            if genre in genres:
                genres[genre] += 1
            else:
                genres[genre] = 1

    # Find the most common genre(s)
    most_common_genres = [genre for genre, count in genres.items() if count == max(genres.values())]

    return jsonify({
        "success": True,
        "filename": file.filename,
        "most_common_genres": most_common_genres,
        "books": books
    }), 200
@app.route('/mood-filter')
def mood_filter():
    return render_template('mood_filter.html')

if __name__ == '__main__':
    app.run(debug=True)
