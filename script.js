let allProducts = [];
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

/* ================= LOGIN ================= */
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

/* ================= SEARCH ================= */
async function searchProduct() {
    const query = document.getElementById("searchInput")?.value;
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

/* ================= FILTER ================= */
function applySortAndFilter() {
    let filtered = [...allProducts];

    const category = document.getElementById("categorySelect")?.value || "all";
    const sort = document.getElementById("sortSelect")?.value || "relevance";

    if (category !== "all") {
        filtered = filtered.filter(p =>
            p.category?.toLowerCase().includes(category)
        );
    }

    if (sort === "low") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
        filtered.sort((a, b) => b.price - a.price);
    }

    displayProducts(filtered);
}

/* ================= DISPLAY PRODUCTS ================= */
function displayProducts(products) {
    const results = document.getElementById("results");
    if (!results) return;

    if (products.length === 0) {
        results.innerHTML = "<p>No products found</p>";
        return;
    }

    results.innerHTML = products.map(p => {
        const rupees = Math.round(p.price * 83);
        const dealScore = Math.round(100 - (p.price / 10));

        return `
        <div class="product-card">
            <img src="${p.thumbnail || p.images?.[0] || 'https://via.placeholder.com/200'}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/200';" />
            <h3>${p.title}</h3>
            <p>₹${rupees.toLocaleString()}</p>
            <p style="color:gray">${p.brand || ""}</p>
            <p style="color:#22c55e;font-weight:bold;">Deal Score: ${dealScore}</p>
            <button onclick='addToWatchlist(${JSON.stringify(p)})'>Save</button>
        </div>
        `;
    }).join("");
}

/* ================= WATCHLIST ================= */
function addToWatchlist(product) {
    watchlist.push(product);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    displayWatchlist();
}

function displayWatchlist() {
    const box = document.getElementById("watchlist");
    if (!box) return;

    if (watchlist.length === 0) {
        box.innerHTML = "<p>No saved items</p>";
        return;
    }

    box.innerHTML = watchlist.map(p => `
        <div class="watch-item">
            <h4>${p.title}</h4>
            <p>₹${Math.round(p.price * 83).toLocaleString()}</p>
        </div>
    `).join("");
}

/* ================= COMPARE ================= */
async function runCompareSearch() {
    const query = document.getElementById("searchInput")?.value.toLowerCase();
    if (!query) return;

    try {
        const [amazon, flipkart, meesho] = await Promise.all([
            fetch("./amazon.json").then(r => r.json()),
            fetch("./flipkart.json").then(r => r.json()),
            fetch("./meesho.json").then(r => r.json())
        ]);

        const filter = (data) => data.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.category && p.category.toLowerCase().includes(query))
        );

        const a = filter(amazon);
        const f = filter(flipkart);
        const m = filter(meesho);

        displayCompare("amazon-results", a);
        displayCompare("flipkart-results", f);
        displayCompare("meesho-results", m);

        renderChart([...a, ...f, ...m]);

    } catch (err) {
        console.log("Compare error:", err);
    }
}

/* ================= DISPLAY COMPARE ================= */
function displayCompare(id, products) {
    const box = document.getElementById(id);
    if (!box) return;

    if (products.length === 0) {
        box.innerHTML = "<p>No results</p>";
        return;
    }

    box.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.thumbnail || p.image || 'https://via.placeholder.com/200'}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=No+Image';" />
            <h3>${p.title}</h3>
            <p>${p.price}</p>
            <a href="${p.link}" target="_blank">View</a>
        </div>
    `).join("");
}

/* ================= CHART ================= */
function renderChart(products) {
    const canvas = document.getElementById("priceChart");
    if (!canvas) return;

    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

    const labels = products.map(p => p.title.substring(0, 10));
    const prices = products.map(p =>
        parseInt(p.price.replace(/[₹,]/g, "")) || 0
    );

    window.chartInstance = new Chart(canvas, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Price Comparison',
                data: prices
            }]
        }
    });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    displayWatchlist();
});