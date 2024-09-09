// Updated snippet in Recommender.js
async function fetchBooksByGenre(genres) {
    const API_KEY = 'AIzaSyDeW6pjzhEFhFyG8IqJMLpRCwPbi4tQvys'; // Your Google Books API Key
    let books = [];
    
    for (const genre of genres) {
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=subject:${encodeURIComponent(genre)}&maxResults=10&key=${API_KEY}`);
        const data = await response.json();
        
        if (data.items) {
            books = books.concat(data.items.map(item => ({
                title: item.volumeInfo.title,
                authors: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
                coverUrl: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=2') : 'https://via.placeholder.com/128x193?text=No+Cover+Available',
                genres: item.volumeInfo.categories ? item.volumeInfo.categories.map(genre => genre.toLowerCase().trim()) : [], // Normalize genres
                average_rating: item.volumeInfo.averageRating || 'N/A',
                language_code: item.volumeInfo.language || 'N/A',
                num_pages: item.volumeInfo.pageCount || 'N/A',
                ratings_count: item.volumeInfo.ratingsCount || 'N/A',
                text_reviews_count: item.volumeInfo.textReviewsCount || 'N/A'
            })));
        }
    }
    
    return books.slice(0, 10); // Return the top 10 books across genres
}

// Add event listener for the "Generate Recommendations" button
document.querySelector('.recommendation-button').addEventListener('click', async () => {
    const selectedBooks = Array.from(document.querySelectorAll('.book-slot img')).map(img => ({
        title: img.alt,
        genres: img.dataset.genres ? img.dataset.genres.split(',').map(genre => genre.toLowerCase().trim()) : [] // Normalize genres
    }));

    console.log('Selected Books:', selectedBooks); // Debug: Log selected books and their genres

    if (selectedBooks.length === 3) {
        // Collecting all genres into one array
        let allGenres = [];
        selectedBooks.forEach(book => {
            allGenres = allGenres.concat(book.genres);
        });

        console.log('Aggregated Genres:', allGenres); // Debug: Log all aggregated genres

        // Find common genres
        const genreCount = {};
        allGenres.forEach(genre => {
            genreCount[genre] = (genreCount[genre] || 0) + 1;
        });

        console.log('Genre Count:', genreCount); // Debug: Log the count of each genre

        const commonGenres = Object.keys(genreCount).filter(genre => genreCount[genre] === selectedBooks.length);

        console.log('Common Genres:', commonGenres); // Debug: Log the common genres found

        if (commonGenres.length > 0) {
            const recommendedBooks = await fetchBooksByGenre(commonGenres);

            console.log('Recommended Books:', recommendedBooks); // Debug: Log the recommended books

            // Display the recommended books (you can modify this as needed)
            for (let i = 0; i < 3; i++) {
                if (recommendedBooks[i]) {
                    const recommendationSlot = document.getElementById(`recommendation${i + 1}`);
                    recommendationSlot.src = recommendedBooks[i].coverUrl;
                    recommendationSlot.style.display = 'block';
                }
            }
        } else {
            console.log('No common genres found among the selected books.');
        }
    } else {
        console.log('Please select exactly 3 books to generate recommendations.');
    }
});
