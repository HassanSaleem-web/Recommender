document.getElementById('goodreads-file').addEventListener('change', function() {
    const fileInput = document.getElementById('goodreads-file');
    const file = fileInput.files[0];
    const apiKey = '';

    if (file) {
        const formData = new FormData();
        formData.append('goodreads-file', file);

        fetch('/upload', {
            method: 'POST',
            body: formData,
        })
        .then(response => {
            if (response.ok) {
                return response.json();
            } else {
                throw new Error('File upload failed');
            }
        })
        .then(data => {
            console.log('File uploaded successfully:', data);

            if (data.success) {
                let total_pages = 0;
                let total_ratings = 0;
                let authorCount = {};
                let genreCount = {};

                const booksForGenreAnalysis = data.books.slice(0, Math.ceil(data.books.length / 2));
                let genrePromises = [];

                booksForGenreAnalysis.forEach(book => {
                    total_pages += parseInt(book.num_pages) || 0;
                    total_ratings += parseFloat(book.average_rating) || 0;

                    const authors = book.authors.split(', ');
                    authors.forEach(author => {
                        authorCount[author] = (authorCount[author] || 0) + 1;
                    });

                    const query = encodeURIComponent(book.title);
                    const url = `https://www.googleapis.com/books/v1/volumes?q=${query}&key=${apiKey}`;

                    genrePromises.push(
                        fetch(url)
                            .then(response => response.json())
                            .then(apiData => {
                                if (apiData.items && apiData.items.length > 0) {
                                    const categories = apiData.items[0].volumeInfo.categories || [];
                                    categories.forEach(genre => {
                                        genreCount[genre] = (genreCount[genre] || 0) + 1;
                                    });
                                }
                            })
                            .catch(error => console.error('Error fetching genre:', error))
                    );

                    console.log(`Title: ${book.title}`);
                    console.log(`Authors: ${book.authors}`);
                    console.log(`Average Rating: ${book.average_rating}`);
                    console.log(`Number of Pages: ${book.num_pages}`);
                    console.log(`Genres: ${book.genres.join(', ')}`);
                    console.log('---------------------------');
                });

                Promise.all(genrePromises).then(() => {
                    const avg_pages = total_pages / data.books.length;
                    const avg_rating = total_ratings / data.books.length;
                    const predominant_authors = Object.keys(authorCount).filter(author => authorCount[author] > data.books.length / 5);

                    console.log(`Average Number of Pages: ${avg_pages}`);
                    console.log(`Average Rating: ${avg_rating}`);
                    console.log(`Predominant Author(s): ${predominant_authors.join(', ')}`);

                    const totalGenres = Object.values(genreCount).reduce((a, b) => a + b, 0);
                    const avgGenreFrequency = totalGenres / Object.keys(genreCount).length;
                    const predominantGenres = Object.keys(genreCount).filter(genre => genreCount[genre] > avgGenreFrequency);

                    console.log('Predominant Genres from Google Books API:', predominantGenres.join(', '));

                    let bookPromises = [];
                    let foundBooks = [];

                    predominantGenres.forEach(genre => {
                        const genreQuery = encodeURIComponent(genre);
                        const genreUrl = `https://www.googleapis.com/books/v1/volumes?q=subject:${genreQuery}&orderBy=relevance&maxResults=10&key=${apiKey}`;

                        bookPromises.push(
                            fetch(genreUrl)
                                .then(response => response.json())
                                .then(apiData => {
                                    if (apiData.items) {
                                        apiData.items.forEach(item => {
                                            foundBooks.push({
                                                title: item.volumeInfo.title,
                                                authors: item.volumeInfo.authors ? item.volumeInfo.authors.join(', ') : 'Unknown',
                                                averageRating: item.volumeInfo.averageRating || 0,
                                                pageCount: item.volumeInfo.pageCount || 0,
                                                genre: genre,
                                                thumbnail: item.volumeInfo.imageLinks ? item.volumeInfo.imageLinks.thumbnail : '',
                                                infoLink: item.volumeInfo.infoLink
                                            });
                                        });
                                    }
                                })
                                .catch(error => console.error('Error fetching books:', error))
                        );
                    });

                    Promise.all(bookPromises).then(() => {
                        foundBooks.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
                        const topBooks = foundBooks.slice(0, 20);

                        topBooks.sort((a, b) => {
                            const aDiff = Math.abs(a.pageCount - avg_pages) + Math.abs(a.averageRating - avg_rating);
                            const bDiff = Math.abs(b.pageCount - avg_pages) + Math.abs(b.averageRating - avg_rating);
                            return aDiff - bDiff;
                        });

                        const bestThree = topBooks.slice(0, 3);
                        console.log('Best 3 Books Based on Average Pages and Ratings:');
                        bestThree.forEach((book, index) => {
                            console.log(`${index + 1}. ${book.title} by ${book.authors} - Pages: ${book.pageCount} - Rating: ${book.averageRating}`);
                            console.log(`More info: ${book.infoLink}`);
                            console.log('---------------------------');
                        });

                        displayBestThree(bestThree);
                    });
                });
            } else {
                alert('Failed to process file.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Failed to upload file. Please try again.');
        });
    } else {
        alert('Please select a file to upload.');
    }
});

function displayBestThree(books) {
    books.forEach((book, index) => {
        const imgElement = document.getElementById(`goodreads-recommendation${index + 1}`);
        const titleElement = document.getElementById(`goodreads-title${index + 1}`);

        imgElement.src = book.thumbnail || 'default-placeholder.png';  // Use the thumbnail or a placeholder
        imgElement.style.display = 'block';
        titleElement.textContent = `${book.title} by ${book.authors} - Pages: ${book.pageCount} - Rating: ${book.averageRating}`;
        titleElement.style.display = 'block';
    });
}
