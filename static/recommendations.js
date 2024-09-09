document.addEventListener('DOMContentLoaded', () => {
    const recommendations = JSON.parse(localStorage.getItem('topRecommendations')) || [];
    const recommendationList = document.getElementById('recommendation-list');

    recommendations.forEach(rec => {
        const recommendationItem = document.createElement('div');
        recommendationItem.className = 'recommendation-item';
        recommendationItem.innerHTML = `
            <img src="${rec.book.coverUrl}" alt="${rec.book.title}" class="book-cover"/>
            <p><strong>${rec.book.title}</strong></p>
            <p>Author: ${rec.book.authors}</p>
            <p>Rating: ${rec.book.average_rating}</p>
            <a href="#" class="amazon-link">Buy on Amazon</a>
            <p><em>Why recommended: ${rec.reasons}</em></p>
        `;
        recommendationList.appendChild(recommendationItem);
    });
});

function goBack() {
    window.history.back();
}
