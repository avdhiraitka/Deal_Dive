/* ---------------- AUTH SYSTEM ---------------- */

function openLogin() {
    document.getElementById("loginModal").style.display = "flex";
}

function closeLogin() {
    document.getElementById("loginModal").style.display = "none";
}

function signupUser() {
    let user = username.value;
    let pass = password.value;

    localStorage.setItem("dealdiveUser", user);
    localStorage.setItem("dealdivePass", pass);

    alert("Signup successful! Now login.");
}

function loginUser() {
    let user = username.value;
    let pass = password.value;

    if (
        user === localStorage.getItem("dealdiveUser") &&
        pass === localStorage.getItem("dealdivePass")
    ) {
        localStorage.setItem("loggedIn", "true");
        closeLogin();
        showDashboard(user);
    } else {
        alert("Invalid login ❌");
    }
}

function logout() {
    localStorage.setItem("loggedIn", "false");
    location.reload();
}

function showDashboard(user) {
    const authBtn = document.querySelector(".auth-buttons");
    if (authBtn) {
        authBtn.innerHTML =
            `Hi, ${user} 👋 <span onclick="logout()" style="color:red;cursor:pointer;">Logout</span>`;
    }
}

/* AUTO LOGIN */
window.onload = function () {
    if (localStorage.getItem("loggedIn") === "true") {
        showDashboard(localStorage.getItem("dealdiveUser"));
    }
    loadWatchlist();

    // Check which page we are on
    if (document.getElementById("compareGrid")) {
        initComparePage();
    } else if (document.getElementById("results")) {
        // Main search page
        searchProduct();
    }
};

/* ---------------- COMPARE PAGE LOGIC ---------------- */

async function initComparePage() {
    console.log("Initializing Compare Page...");
    // Bind search button
    const btn = document.querySelector("button[onclick='searchProduct()']");
    if (btn) btn.onclick = runCompareSearch;

    // Bind enter key
    const input = document.getElementById("searchInput");
    if (input) {
        input.onkeyup = (e) => {
            if (e.key === 'Enter') runCompareSearch();
        };
    }

    // Initial load empty or predefined?
    // Let's run a default search or wait
    // Maybe search for "iphone" as demo
    document.getElementById("searchInput").value = "iphone";
    runCompareSearch();
}

async function runCompareSearch() {
    let query = document.getElementById("searchInput").value.toLowerCase();

    document.getElementById("amazon-results").innerHTML = "Loading...";
    document.getElementById("flipkart-results").innerHTML = "Loading...";
    document.getElementById("meesho-results").innerHTML = "Loading...";

    try {
        const [amazon, flipkart, meesho] = await Promise.all([
            fetch('amazon.json').then(res => res.json()).catch(() => []),
            fetch('flipkart.json').then(res => res.json()).catch(() => []),
            fetch('meesho.json').then(res => res.json()).catch(() => [])
        ]);

        renderColumn("amazon-results", amazon, query);
        renderColumn("flipkart-results", flipkart, query);
        renderColumn("meesho-results", meesho, query);

    } catch (e) {
        console.error(e);
    }
}

function renderColumn(elementId, data, query) {
    const container = document.getElementById(elementId);
    // Filter with fuzzy match
    const filtered = data.filter(item => calculateMatchScore(item, query, "all"));

    if (filtered.length === 0) {
        container.innerHTML = "<p>No results.</p>";
        return;
    }

    let output = "";
    filtered.forEach(item => {
        let dealScore = Math.floor(Math.random() * 40) + 60;
        let img = item.thumbnail || item.image || "https://via.placeholder.com/150";
        // Simplified card for column
        output += `
            <div class="product-card" style="margin-bottom: 15px;">
                <img src="${img}" style="height:120px; object-fit:contain;" />
                <h4 style="font-size:14px; margin: 5px 0;">${item.title}</h4>
                <p class="price">${item.price}</p>
                 <a href="${item.link}" target="_blank" style="font-size:12px; color:blue;">View</a>
            </div>
        `;
    });
    container.innerHTML = output;
}

/* ---------------- PRODUCT API SEARCH ---------------- */

/* ---------------- PRODUCT API SEARCH ---------------- */

let currentProducts = []; // Store fetched products for filtering/sorting

async function searchProduct() {
    let query = document.getElementById("searchInput").value.toLowerCase();
    let category = document.getElementById("categorySelect")?.value || "all";

    // Warn if using file protocol
    if (window.location.protocol === 'file:') {
        document.getElementById("results").innerHTML = `
            <div style="color: red; padding: 20px; border: 1px solid red; background: #fff0f0; border-radius: 8px;">
                <h3>⚠️ Protocol Error</h3>
                <p>Browsers block <b>fetch()</b> on local files for security.</p>
                <p>Please run a local server:</p>
                <code>npx http-server .</code>
                <p>Then open <b>http://127.0.0.1:8080</b></p>
            </div>`;
        return;
    }

    document.getElementById("results").innerHTML = "🔍 Searching local deals...";

    try {
        // Fetch from local JSON files
        const [amazon, flipkart, meesho] = await Promise.all([
            fetch('amazon.json').then(res => res.json()).catch(err => { console.error('Amazon fetch failed', err); return []; }),
            fetch('flipkart.json').then(res => res.json()).catch(err => { console.error('Flipkart fetch failed', err); return []; }),
            fetch('meesho.json').then(res => res.json()).catch(err => { console.error('Meesho fetch failed', err); return []; })
        ]);

        // Combine and Filter
        currentProducts = [...amazon, ...flipkart, ...meesho].filter(item => {
            return calculateMatchScore(item, query, category);
        });

        if (currentProducts.length === 0) {
            document.getElementById("results").innerHTML = "<p>No products found.</p>";
            return;
        }

        applySortAndFilter(); // Initial display

    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById("results").innerHTML = "<p>Error loading data. Check console for details.</p>";
    }
}

/* ---------------- SORT & FILTER ---------------- */

function applySortAndFilter() {
    let sortOption = document.getElementById("sortSelect")?.value || "relevance";
    // Parse prices: Remove '₹', commas, and convert to integer
    // Note: some prices might be strings like "₹1,299"

    let sorted = [...currentProducts];

    if (sortOption === "low") {
        sorted.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortOption === "high") {
        sorted.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    displayProducts(sorted);
}

function parsePrice(priceStr) {
    if (!priceStr) return 0;
    return parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
}

/* ---------------- DISPLAY PRODUCTS ---------------- */

function displayProducts(products) {
    let output = "";

    if (products.length === 0) {
        document.getElementById("results").innerHTML = "<p>No products match your filters.</p>";
        return;
    }

    products.forEach((item) => {
        let dealScore = Math.floor(Math.random() * 40) + 60;
        // Handle different image keys (thumbnail vs image)
        let img = item.thumbnail || item.image || "https://via.placeholder.com/150";

        output += `
      <div class="product-card">
        <label class="store-badge ${item.store.toLowerCase()}">${item.store}</label>
        <img src="${img}" alt="${item.title}" />
        <h3>${item.title}</h3>
        <p class="price">${item.price}</p>
        <p>⭐ Deal Score: <b>${dealScore}</b></p>
        <a href="${item.link}" target="_blank" class="view-btn">View Deal</a>
        <button onclick="addToWatchlist('${item.title.replace(/'/g, "\\'")}')">
          + Watch
        </button>
      </div>
    `;
    });

    document.getElementById("results").innerHTML = output;
}

/* ---------------- WATCHLIST FEATURE ---------------- */

function addToWatchlist(product) {
    if (localStorage.getItem("loggedIn") !== "true") {
        alert("Login required to save deals!");
        return;
    }

    let list = JSON.parse(localStorage.getItem("watchlist")) || [];
    list.push(product);

    localStorage.setItem("watchlist", JSON.stringify(list));

    alert("Added to Watchlist ✅");
    loadWatchlist();
}



function loadWatchlist() {
    const watchlistEl = document.getElementById("watchlist");
    if (!watchlistEl) return; // Skip on pages without watchlist

    let list = JSON.parse(localStorage.getItem("watchlist")) || [];

    let output = "";

    list.forEach((item) => {
        output += `<div class="watch-item">🔥 ${item}</div>`;
    });

    watchlistEl.innerHTML =
        output || "<p style='color:gray'>No saved deals yet.</p>";
}

/* ---------------- HELPER: FUZZY MATCH ---------------- */

function calculateMatchScore(item, query, category) {
    const cleanQuery = query.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();

    // 1. Check Category Match First (Strict)
    if (category !== "all" && item.category && item.category !== category) {
        return false;
    }

    // 2. Empty Query -> Show All (if category matches)
    if (!cleanQuery) return true;

    // 3. Token-based Matching
    // Split by non-alphanumeric chars to handle "(128GB)", "-", etc.
    const tokens = cleanQuery.split(/[^a-z0-9]+/);
    const title = item.title.toLowerCase();

    // Helper to strip special chars from a string
    const strip = (s) => s.replace(/[^a-z0-9]/g, '');

    // Count how many query tokens appear in the title
    let matches = 0;
    const validTokens = tokens.filter(t => t && t.length > 0);

    validTokens.forEach(token => {
        // Check if the stripped token exists in the stripped title
        // This handles "128GB" (stripped) vs "128 GB" (stripped -> 128gb)
        // Also check if the raw token exists in the raw title
        if (title.includes(token) || strip(title).includes(strip(token))) {
            matches++;
        }
    });

    // Strategy: 
    // - If query is short (1 word), require it to persist.
    // - If long query, require > 40% of words to match.
    // - Also give bonus if Category matches query (e.g. "laptop" in query and category="laptop")

    if (validTokens.length === 1) {
        const token = validTokens[0];
        return title.includes(token) ||
            strip(title).includes(strip(token)) ||
            (item.category && item.category.includes(token));
    }

    // Lower threshold slightly for very long queries
    const matchRatio = matches / validTokens.length;
    return matchRatio >= 0.4; // 40% match threshold
}
