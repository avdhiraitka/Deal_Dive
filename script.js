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
    const query = document.getElementById("searchInput").value;

    if (!query) return;

    document.getElementById("results").innerHTML = "Loading...";

    try {
        const res = await fetch(`https://dummyjson.com/products/search?q=${query}`);
        const data = await res.json();

        allProducts = data.products;
        applySortAndFilter();

    } catch {
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
            p.category.toLowerCase().includes(category)
        );
    }

    if (sort === "low") {
        filtered.sort((a, b) => a.price - b.price);
    } else if (sort === "high") {
        filtered.sort((a, b) => b.price - a.price);
    }

    displayProducts(filtered);
}

/* ================= DISPLAY (₹ FIXED) ================= */
function displayProducts(products) {
    const results = document.getElementById("results");
    if (!results) return;

    if (products.length === 0) {
        results.innerHTML = "<p>No products found</p>";
        return;
    }

    results.innerHTML = products.map(p => {
        const rupees = Math.round(p.price * 83); // USD → INR
        const dealScore = Math.max(10, 100 - Math.floor(p.price));

        return `
        <div class="product-card">
            <img src="${p.thumbnail}" />
            <h3>${p.title}</h3>

            <!-- ₹ FIX -->
            <p>₹${rupees.toLocaleString()}</p>

            <p style="color:gray">${p.brand || ""}</p>

            <p style="color:#22c55e;font-weight:bold;">
                Deal Score: ${dealScore}
            </p>

            <button onclick='addToWatchlist(${JSON.stringify(p)})'>Save</button>
        </div>`;
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
    const query = document.getElementById("searchInput").value.toLowerCase();
    if (!query) return;

    try {
        const [amazon, flipkart, meesho] = await Promise.all([
            fetch("./amazon.json").then(r => r.json()),
            fetch("./flipkart.json").then(r => r.json()),
            fetch("./meesho.json").then(r => r.json())
        ]);

        const filter = data =>
            data.filter(p => p.title.toLowerCase().includes(query));

        displayCompare("amazon-results", filter(amazon));
        displayCompare("flipkart-results", filter(flipkart));
        displayCompare("meesho-results", filter(meesho));

    } catch (err) {
        console.error("Compare error:", err);
    }
}

/* ================= DISPLAY COMPARE (IMAGE FIX) ================= */
function displayCompare(id, products) {
    const box = document.getElementById(id);
    if (!box) return;

    if (products.length === 0) {
        box.innerHTML = "<p>No results</p>";
        return;
    }

    box.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.thumbnail}" onerror="this.src='https://via.placeholder.com/200'" />
            <h3>${p.title}</h3>
            <p>${p.price}</p>
            <a href="${p.link}" target="_blank">View</a>
        </div>
    `).join("");
}

/* ================= INIT ================= */
displayWatchlist();