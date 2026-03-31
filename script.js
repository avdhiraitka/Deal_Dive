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

/* ================= SEARCH (API) ================= */
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

/* ================= FILTER + SORT ================= */
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

/* ================= DISPLAY PRODUCTS ================= */
function displayProducts(products) {
    const results = document.getElementById("results");

    if (!results) return;

    if (products.length === 0) {
        results.innerHTML = "<p>No products found</p>";
        return;
    }

    results.innerHTML = products.map(p => `
        <div class="product-card">
            <img src="${p.thumbnail}" />
            <h3>${p.title}</h3>
            <p>₹${p.price}</p>
            <p style="color:gray">${p.brand || ""}</p>

            <div class="deal-bar">
                <div class="deal-fill" style="width:${Math.min(100, p.price)}%"></div>
            </div>

            <button onclick='addToWatchlist(${JSON.stringify(p)})'>Save</button>
        </div>
    `).join("");
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
            <p>₹${p.price}</p>
        </div>
    `).join("");
}

/* ================= COMPARE FEATURE (NEW 🔥) ================= */
async function runCompareSearch() {
    const query = document.getElementById("searchInput").value.toLowerCase();

    if (!query) return;

    try {
        const [amazon, flipkart, meesho] = await Promise.all([
            fetch("./amazon.json").then(r => r.json()),
            fetch("./flipkart.json").then(r => r.json()),
            fetch("./meesho.json").then(r => r.json())
        ]);

        const filter = (data) => data.filter(p =>
            p.title.toLowerCase().includes(query)
        );

        const a = filter(amazon);
        const f = filter(flipkart);
        const m = filter(meesho);

        displayCompare("amazon-results", a);
        displayCompare("flipkart-results", f);
        displayCompare("meesho-results", m);

        highlightBestDeal(a, f, m);

    } catch (err) {
        console.error(err);
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
            <img src="${p.thumbnail}" />
            <h3>${p.title}</h3>
            <p>${p.price}</p>
            <a href="${p.link}" target="_blank">View</a>
        </div>
    `).join("");
}

/* ================= BEST DEAL LOGIC (NEW 🔥) ================= */
function highlightBestDeal(a, f, m) {
    const all = [...a, ...f, ...m];

    if (all.length === 0) return;

    let min = all[0];

    all.forEach(p => {
        const price = parseInt(p.price.replace(/[₹,]/g, ""));
        const minPrice = parseInt(min.price.replace(/[₹,]/g, ""));

        if (price < minPrice) min = p;
    });

    console.log("Best Deal:", min.title, min.price);

    // OPTIONAL UI highlight
    document.body.insertAdjacentHTML("afterbegin", `
        <div style="
            position:fixed;
            bottom:20px;
            right:20px;
            background:#22c55e;
            padding:10px 15px;
            border-radius:10px;
            font-size:14px;
            z-index:999;
        ">
            🏆 Best Deal: ${min.title} (${min.price})
        </div>
    `);
}

/* ================= INIT ================= */
displayWatchlist();