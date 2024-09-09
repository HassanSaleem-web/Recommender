// Function to handle file selection and processing
document.getElementById('goodreads-file').addEventListener('change', function(event) {
    const file = event.target.files[0]; // Get the selected file

    if (file) {
        const reader = new FileReader();

        reader.onload = function(e) {
            const csv = e.target.result;
            processCSV(csv); // Process the CSV once it's loaded
        };

        reader.readAsText(file); // Read the file as text
    } else {
        console.log('No file selected');
    }
});

// Function to process the CSV data
function processCSV(csv) {
    const lines = csv.split('\n').slice(1); // Split into lines and remove header
    const books = [];

    lines.forEach(line => {
        const columns = line.split(',');
        const book = {
            title: columns[1].replace(/"/g, ''), // Remove quotes
            authors: columns[2].replace(/"/g, ''),
            genres: columns[16].replace(/"/g, '').split(';').map(genre => genre.trim()), // Bookshelves as genres
            average_rating: columns[8],
            language_code: '', // Placeholder, as language isn't provided in CSV
            num_pages: columns[11],
            ratings_count: '', // Placeholder, ratings count isn't provided in CSV
            text_reviews_count: '' // Placeholder, text reviews count isn't provided in CSV
        };

        books.push(book);
    });

    // Now find common genres
    findCommonGenres(books);

    // Log the required information
    books.forEach(book => {
        console.log(`Title: ${book.title}`);
        console.log(`Authors: ${book.authors}`);
        console.log(`Genres: ${book.genres.join(', ')}`);
        console.log(`Average Rating: ${book.average_rating}`);
        console.log(`Language Code: ${book.language_code}`);
        console.log(`Number of Pages: ${book.num_pages}`);
        console.log(`Ratings Count: ${book.ratings_count}`);
        console.log(`Text Reviews Count: ${book.text_reviews_count}`);
        console.log('---------------------------');
    });
}

// Function to find common genres among the books
function findCommonGenres(books) {
    const genreCount = {};

    books.forEach(book => {
        book.genres.forEach(genre => {
            if (genre) {
                genreCount[genre] = (genreCount[genre] || 0) + 1;
            }
        });
    });

    const commonGenres = Object.entries(genreCount).filter(([genre, count]) => count > 1);
    console.log('Common Genres:', commonGenres.map(([genre, count]) => `${genre} (${count})`).join(', '));
}
