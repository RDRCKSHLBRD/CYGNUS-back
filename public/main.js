const API_URL = "/api/news";

// Fetch all news
async function fetchNews() {
    const response = await fetch(API_URL);
    const news = await response.json();
    const newsList = document.getElementById("news-list");
    newsList.innerHTML = "";

    news.forEach(article => {
        const li = document.createElement("li");
        li.innerHTML = `<strong>${article.title}</strong>: ${article.body} 
                        <button onclick="deleteNews(${article.id})">Delete</button>`;
        newsList.appendChild(li);
    });
}

// Add news
async function addNews() {
    const title = document.getElementById("news-title").value;
    const body = document.getElementById("news-body").value;

    await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body }),
    });

    fetchNews();
}

// Delete news
async function deleteNews(id) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchNews();
}

// Initialize
fetchNews();
