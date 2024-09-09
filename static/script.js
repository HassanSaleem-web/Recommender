const API_KEY = 'AIzaSyDeW6pjzhEFhFyG8IqJMLpRCwPbi4tQvys'; // Your Google Books API Key

document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all trash icons
    const trashIcons = document.querySelectorAll('.trash-icon');

    trashIcons.forEach((icon, index) => {
        icon.addEventListener('click', () => {
            const slot = icon.closest('.book-input').querySelector('.book-slot');
            slot.innerHTML = '+'; // Reset the slot to its initial state
        });
    });
});

async function fetchBooksFromAPI(query) {
    // Construct the API URL with 'intitle' and 'maxResults' parameters
    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=intitle:${query}&maxResults=10&key=${API_KEY}`;

    try {
        // Fetch books from the Google Books API
        const response = await fetch(apiUrl);

        // Throw an error if the response is not okay
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        // Parse the JSON data from the response
        const data = await response.json();

        // If there are items in the response, map them to an array of book objects
        if (data.items) {
            return data.items.map(item => ({
                title: item.volumeInfo.title,
                authors: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown Author',
                coverUrl: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail.replace('http:', 'https:').replace('&zoom=1', '&zoom=2') : 'https://via.placeholder.com/128x193?text=No+Cover+Available',
                genres: item.volumeInfo.categories || [],  // Fetching genres (categories) of the book
                average_rating: item.volumeInfo.averageRating || 'N/A',
                language_code: item.volumeInfo.language || 'N/A',
                num_pages: item.volumeInfo.pageCount || 'N/A',
                ratings_count: item.volumeInfo.ratingsCount || 'N/A',
                text_reviews_count: item.volumeInfo.textReviewsCount || 'N/A'
            }));
        } else {
            // Return an empty array if no items are found
            return [];
        }
    } catch (error) {
        console.error('Error fetching books:', error); // Log the error
        return []; // Return an empty array on error
    }
}

let debounceTimer;

function debounce(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

// Usage in your search input
document.querySelector('.book-search').addEventListener('input', function() {
    debounce(() => filterBooks(this), 300); // Debounce with a 300ms delay
});


async function filterBooks(input) {
    const searchTerm = input.value.toLowerCase();
    const dropdown = input.nextElementSibling;
    dropdown.innerHTML = '';

    if (searchTerm.length > 0) {
        const books = await fetchBooksFromAPI(searchTerm);

        books.forEach((book, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                <img src="${book.coverUrl}" alt="${book.title}" style="width: 40px; height: 60px; margin-right: 10px; vertical-align: middle;">
                <span>${book.title} - ${book.authors}</span>
            `;
            li.draggable = true;
            li.ondragstart = (event) => drag(event, book);
            li.dataset.index = index;
            li.onclick = () => selectBook(input.closest('.book-input'), book);
            dropdown.appendChild(li);
        });

        dropdown.style.display = 'block';
    } else {
        dropdown.style.display = 'none';
    }
}

function drag(event, book) {
    event.dataTransfer.setData('text/plain', JSON.stringify(book));
}

function allowDrop(event) {
    event.preventDefault();
}

function drop(event) {
    event.preventDefault();
    const data = event.dataTransfer.getData('text/plain');
    const book = JSON.parse(data);

    const slot = event.target;
    slot.innerHTML = `<img src="${book.coverUrl}" alt="${book.title}" class="book-cover"/>`;

    console.log(`Book: ${book.title}`);
    console.log(`Genres: ${book.genres.join(', ')}`);
    console.log(`Average Rating: ${book.average_rating}`);
    console.log(`Language Code: ${book.language_code}`);
    console.log(`Number of Pages: ${book.num_pages}`);
    console.log(`Ratings Count: ${book.ratings_count}`);
    console.log(`Text Reviews Count: ${book.text_reviews_count}`);

    const selectedBooks = Array.from(document.querySelectorAll('.book-slot img')).map(img => ({
        title: img.alt,
        genres: book.genres,
        average_rating: book.average_rating,
        language_code: book.language_code,
        num_pages: book.num_pages,
        ratings_count: book.ratings_count,
        text_reviews_count: book.text_reviews_count
    }));

    if (selectedBooks.length === 3) {
        generateCommonGenres(selectedBooks);
    }
}

function activateSearch(container) {
    const searchInput = document.createElement('input');
    searchInput.setAttribute('type', 'text');
    searchInput.setAttribute('class', 'book-search');
    searchInput.setAttribute('placeholder', 'Search for a book...');
    searchInput.setAttribute('oninput', 'filterBooks(this)');
    container.appendChild(searchInput);

    const dropdown = document.createElement('ul');
    dropdown.setAttribute('class', 'dropdown');
    container.appendChild(dropdown);

    searchInput.focus();

    // Close the search when a book is selected
    searchInput.onblur = () => {
        setTimeout(() => {
            container.removeChild(searchInput);
            container.removeChild(dropdown);
        }, 100);
    };
}

function selectBook(container, book) {
    const slot = container.querySelector('.book-slot');
    slot.innerHTML = `<img src="${book.coverUrl}" alt="${book.title}" class="book-cover"/>`;

    // Close the search dropdown
    container.querySelector('.book-search').blur();
}

function generateCommonGenres(books) {
    // Normalize and validate genre arrays
    const genresArray = books.map(book => (book.genres || []).map(genre => genre.toLowerCase()));
    
    // Ensure all arrays are valid and non-empty before reducing
    if (genresArray.some(arr => arr.length === 0)) {
        document.getElementById('common-themes').innerHTML = `Common genres: None found.`;
        return;
    }

    // Calculate common genres
    const commonGenres = genresArray.reduce((a, b) => a.filter(c => b.includes(c)));

    if (commonGenres.length > 0) {
        document.getElementById('common-themes').innerHTML = `Common genres: ${commonGenres.join(', ')}.`;
        searchBooksByGenres(commonGenres, books);  // Pass selected books to rank recommendations
    } else {
        document.getElementById('common-themes').innerHTML = `Common genres: None found.`;
    }
}

async function searchBooksByGenres(genres, selectedBooks) {
    const books = [];
    let pageIndex = 0;

    while (books.length < 10) {
        for (const genre of genres) {
            console.log(`Searching for books in genre: ${genre}`);
            const genreBooks = await fetchBooksFromAPI(`subject:${genre}&startIndex=${pageIndex}`);
            
            genreBooks.forEach(book => {
                if (books.length < 10 && !books.some(b => b.title === book.title)) {
                    books.push(book);
                }
            });

            if (books.length >= 10) break;
        }

        pageIndex += 10;
    }

    console.log("Books fetched based on common genres:");
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

    // Integrate and rank recommendations
    rankRecommendations(books, selectedBooks);
}

function rankRecommendations(recommendedBooks, selectedBooks) {
    const selectedFeatures = selectedBooks.map(book => [
        parseFloat(book.average_rating),
        book.language_code,
        parseInt(book.num_pages),
    ]);

    const recommendations = recommendedBooks.map(book => ({
        book: book,
        features: [
            parseFloat(book.average_rating),
            book.language_code,
            parseInt(book.num_pages),
        ]
    }));

    const rankedBooks = recommendations.map(rec => {
        const reasons = new Set();
        const distances = selectedFeatures.map(sf => {
            let distance = 0;
            
            // Comparing average rating
            if (rec.features[0] && !isNaN(rec.features[0]) && Math.abs(rec.features[0] - sf[0]) < 0.5) {
                reasons.add("Similar rating");
                distance += Math.abs(rec.features[0] - sf[0]);
            } else {
                distance += 5; // High penalty for dissimilar ratings
            }

            // Comparing language
            if (rec.features[1] === sf[1]) {
                reasons.add("Same language");
            } else {
                distance += 10; // High penalty for different language
            }

            // Comparing number of pages
            if (rec.features[2] && !isNaN(rec.features[2]) && Math.abs(rec.features[2] - sf[2]) < 50) {
                reasons.add("Similar number of pages");
                distance += Math.abs(rec.features[2] - sf[2]) / 10;
            } else {
                distance += 5; // Penalty for dissimilar page counts
            }

            return distance;
        });

        return {
            book: rec.book,
            score: Math.min(...distances),
            reasons: Array.from(reasons).join(', ') || "No specific reason"
        };
    }).sort((a, b) => a.score - b.score);

    console.log("Top 3 ranked recommendations:");
    rankedBooks.slice(0, 3).forEach((rec, index) => {
        console.log(`${index + 1}. ${rec.book.title} by ${rec.book.authors}`);
        console.log(`Score: ${rec.score}`);
        console.log(`Reasons: ${rec.reasons}`);
        console.log('---------------------------');
    });

    document.querySelector('.recommendation-button').addEventListener('click', () => {
        showLoader();
        setTimeout(() => {
            hideLoader();
            displayRecommendations(rankedBooks.slice(0, 3));
        }, 5000);
    });
}


function displayRecommendations(topRecommendations) {
    // Store the top recommendations in localStorage
    localStorage.setItem('topRecommendations', JSON.stringify(topRecommendations));

    // Redirect to the recommendations page
    window.location.href = 'rec.html';
}




function showLoader() {
    document.getElementById('loader').style.display = 'inline-block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}
