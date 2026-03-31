let allProducts = [];
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

// LOGIN SYSTEM (unchanged)
function openLogin() {
    document.getElementById("loginModal").style.display = "flex";
}

function closeLogin() {
    document.getElementById("loginModal").style.display = "none";
}

function loginUser() {
    alert("Logged in successfully!");
    closeLogin();
}

function signupUser() {
    alert("Account created!");
}

// 🔍 REAL API SEARCH
async function searchProduct() {
    const query = document.getElementById("searchInput").value;

    if (!query) return;

    document.getElementById("results").innerHTML = "Loading...";

    try {
        const res = await fetch(`https://dummyjson.com/products/search?q=${query}`);
        const data = await res.json();

        allProducts = data.products;
        applySortAndFilter();

    } catch (err) {
        document.getElementById("results").innerHTML = "Error fetching data";
    }
}

// 🎯 FILTER + SORT
function applySortAndFilter() {
    let filtered = [...allProducts];

    const category = document.getElementById("categorySelect").value;
    const sort = document.getElementById("sortSelect").value;

    // CATEGORY FILTER
    if (category !== "all") {
        filtered = filtered.filter(p =>
            p.category.toLowerCase().includes(category)
        );
    }

    // SORTING
    if (sort === "low") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
        filtered.sort((a, b) => b.price - a.price);
    }

    displayProducts(filtered);
}

// 🖼 DISPLAY PRODUCTS
function displayProducts(products) {
    const results = document.getElementById("results");

    if (products.length === 0) {
        results.innerHTML = "<p>No products found</p>";
        return;
    }

    results.innerHTML = products.map(p => `
        <div class="card">
            <img src="${p.thumbnail}" />
            <h3>${p.title}</h3>
            <p>₹${p.price}</p>
            <p style="color:gray">${p.brand || ""}</p>
            <button onclick='addToWatchlist(${JSON.stringify(p)})'>Save</button>
        </div>
    `).join("");
}

// 📌 WATCHLIST
function addToWatchlist(product) {
    watchlist.push(product);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    displayWatchlist();
}

function displayWatchlist() {
    const box = document.getElementById("watchlist");

    if (watchlist.length === 0) {
        box.innerHTML = "<p>No saved items</p>";
        return;
    }

    box.innerHTML = watchlist.map(p => `
        <div class="card small">
            <h4>${p.title}</h4>
            <p>₹${p.price}</p>
        </div>
    `).join("");
}

// LOAD WATCHLIST ON START
displayWatchlist();