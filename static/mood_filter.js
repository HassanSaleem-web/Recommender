const API_KEY = 'AIzaSyDeW6pjzhEFhFyG8IqJMLpRCwPbi4tQvys'; // Your Google Books API Key

document.addEventListener('DOMContentLoaded', () => {
    // Get all mood buttons
    const moodButtons = document.querySelectorAll('.mood-button');

    // Add click event listeners to each mood button
    moodButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const selectedMood = button.getAttribute('data-mood');

            showLoader();

            await fetchRecommendations(selectedMood);

            // Hide loader after recommendations are loaded
            hideLoader();
        });
    });
});

// Function to fetch recommendations based on selected mood
async function fetchRecommendations(mood) {
    // Mapping moods to relevant search terms or genres
    const moodToSearchTerm = {
        'Happy': 'feel-good',
        'Empowered': 'inspirational success',
        'Nostalgic': 'classic literature retro',
        'Relaxed': 'calming relaxing',
        'Motivated': 'motivational self-help',
        'Surprised': 'mystery thriller',
        'Adventurous': 'adventure travel',
        'Romantic': 'romance love story'
        // Add more mappings as needed
    };

    const searchTerm = moodToSearchTerm[mood] || 'popular'; // Default to 'popular' if mood not found

    try {
        // Fetch books from Google Books API
        const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${searchTerm}&key=${API_KEY}`);
        const data = await response.json();

        if (data.items) {
            // Shuffle books for randomness and select the first 3
            const shuffledBooks = data.items.sort(() => 0.5 - Math.random()).slice(0, 3);
            displayRecommendations(shuffledBooks, mood);
        } else {
            console.error('No books found for this mood:', mood);
            displayNoRecommendations();
        }
    } catch (error) {
        console.error('Error fetching recommendations:', error);
    }
}

// Function to display recommendations
function displayRecommendations(books, mood) {
    const recommendationList = document.getElementById('recommendation-list');
    recommendationList.innerHTML = ''; // Clear previous recommendations

    // Mapping moods to reasons
    const moodReasons = {
        'Happy': 'This book is a feel-good read to lift your spirits!',
        'Empowered': 'An inspiring read to boost your motivation and confidence.',
        'Nostalgic': 'A classic piece that brings back cherished memories.',
        'Relaxed': 'Perfect for winding down and relaxing.',
        'Motivated': 'A great read to ignite your passion and drive.',
        'Surprised': 'A thrilling story full of unexpected twists.',
        'Adventurous': 'An exciting adventure that takes you on a journey.',
        'Romantic': 'A heartwarming love story to captivate you.'
        // Add more mappings as needed
    };

    books.forEach(bookItem => {
        const book = bookItem.volumeInfo;
        const bookElement = document.createElement('div');
        bookElement.className = 'book-recommendation';
        bookElement.innerHTML = `
            <img src="${book.imageLinks?.thumbnail || 'https://via.placeholder.com/128x193?text=No+Cover+Available'}" alt="${book.title}" class="book-cover">
            <h3>${book.title}</h3>
            <p>Author: ${book.authors ? book.authors.join(', ') : 'Unknown Author'}</p>
            <p>Rating: ${book.averageRating || 'N/A'}</p>
            <a href="https://www.amazon.com/s?k=${encodeURIComponent(book.title)}" target="_blank">Buy on Amazon</a>
            <p class="reason">${moodReasons[mood] || 'A great book that fits your selected mood!'}</p>
        `;
        recommendationList.appendChild(bookElement);
    });
}

// Function to display message when no recommendations are found
function displayNoRecommendations() {
    const recommendationList = document.getElementById('recommendation-list');
    recommendationList.innerHTML = '<p>No recommendations found for this mood.</p>';
}

// Function to go back to the previous page
function goBack() {
    window.history.back();
}


function showLoader() {
    document.getElementById('loader').style.display = 'inline-block';
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}
