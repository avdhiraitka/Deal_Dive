let allProducts = [];
let localProducts = []; // holds all products from local JSONs
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];

/* ================= LOAD LOCAL DATA ON START ================= */
async function loadLocalData() {
    try {
        const [amazon, flipkart, meesho] = await Promise.all([
            fetch("./amazon.json").then(r => r.json()),
            fetch("./flipkart.json").then(r => r.json()),
            fetch("./meesho.json").then(r => r.json())
        ]);
        localProducts = [...amazon, ...flipkart, ...meesho];
    } catch (err) {
        console.error("Failed to load local product data:", err);
    }
}

/* ================= LOGIN ================= */
function openLogin() {
    document.getElementById("loginModal").style.display = "flex";
}

function closeLogin() {
    document.getElementById("loginModal").style.display = "none";
}

function loginUser() {
    const username = document.getElementById("username")?.value?.trim();
    if (!username) { alert("Please enter a username."); return; }
    alert("Logged in successfully as " + username + "!");
    closeLogin();
}

function signupUser() {
    const username = document.getElementById("username")?.value?.trim();
    if (!username) { alert("Please enter a username."); return; }
    alert("Account created for " + username + "!");
}

/* ================= SEARCH (uses local JSONs) ================= */
function searchProduct() {
    const query = document.getElementById("searchInput")?.value?.toLowerCase().trim();
    if (!query) return;

    if (!localProducts.length) {
        document.getElementById("results").innerHTML = "<p style='color:#94a3b8'>Data still loading, please try again.</p>";
        return;
    }

    const matched = localProducts.filter(p =>
        p.title.toLowerCase().includes(query) ||
        (p.category && p.category.toLowerCase().includes(query))
    );

    allProducts = matched;
    applySortAndFilter();
}

/* ================= FILTER + SORT ================= */
function applySortAndFilter() {
    let filtered = [...allProducts];

    const category = document.getElementById("categorySelect")?.value || "all";
    const sort = document.getElementById("sortSelect")?.value || "relevance";

    // FIX: now supports all 6 categories
    if (category !== "all") {
        filtered = filtered.filter(p =>
            p.category?.toLowerCase() === category
        );
    }

    if (sort === "low") {
        filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sort === "high") {
        filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    displayProducts(filtered);
}

/* ================= PARSE PRICE HELPER ================= */
function parsePrice(priceStr) {
    return parseInt(String(priceStr).replace(/[₹,]/g, "")) || 0;
}

/* ================= DISPLAY PRODUCTS ================= */
function displayProducts(products) {
    const results = document.getElementById("results");
    if (!results) return;

    if (products.length === 0) {
        results.innerHTML = "<p style='color:#94a3b8;text-align:center;padding:20px;'>No products found. Try a different search.</p>";
        return;
    }

    // Find lowest price per title for "Best Deal" badge
    const titlePriceMap = {};
    products.forEach(p => {
        const price = parsePrice(p.price);
        if (!titlePriceMap[p.title] || price < titlePriceMap[p.title]) {
            titlePriceMap[p.title] = price;
        }
    });

    results.innerHTML = products.map(p => {
        const price = parsePrice(p.price);
        const priceHistory = p.priceHistory || [];
        const allPrices = priceHistory.map(h => h.price);
        const lowest = allPrices.length ? Math.min(...allPrices) : price;
        const highest = allPrices.length ? Math.max(...allPrices) : price;
        const drop = highest - price;
        const dropPct = highest > 0 ? Math.round((drop / highest) * 100) : 0;
        const dealScore = Math.min(99, Math.max(30, dropPct + 40));
        const isBest = price === titlePriceMap[p.title];

        const storeColor = p.store === "Amazon" ? "#ff9900" : p.store === "Flipkart" ? "#2874f0" : "#f43397";

        return `
        <div class="product-card">
            ${isBest ? '<div class="best-deal">🏷 Best Deal</div>' : ''}
            <img src="${p.thumbnail || 'https://via.placeholder.com/200'}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/200';" />
            <h3>${p.title}</h3>
            <p style="font-size:1.2rem;font-weight:bold;color:#4fd1c5;">${p.price}</p>
            <p style="color:${storeColor};font-weight:600;">${p.store}</p>
            ${drop > 0 ? `<p style="color:#22c55e;font-size:13px;">↓ ₹${drop.toLocaleString()} drop (${dropPct}% off peak)</p>` : ''}
            <p style="color:#22c55e;font-weight:bold;">Deal Score: ${dealScore}/99</p>
            <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap;">
                <a href="${p.link}" target="_blank"
                   style="background:#1e293b;color:#4fd1c5;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:13px;">
                   View →
                </a>
                <button onclick='addToWatchlist(${JSON.stringify(p).replace(/'/g, "&#39;")})'>+ Watchlist</button>
            </div>
        </div>
        `;
    }).join("");
}

/* ================= WATCHLIST ================= */
function addToWatchlist(product) {
    // Prevent duplicates by link
    const exists = watchlist.some(w => w.link === product.link);
    if (exists) {
        alert("Already in watchlist!");
        return;
    }
    watchlist.push(product);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    if (document.getElementById("watchlist")) {
        displayWatchlist();
    }
    alert("Added to watchlist!");
}

function removeFromWatchlist(link) {
    watchlist = watchlist.filter(w => w.link !== link);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    displayWatchlist();
}

function displayWatchlist() {
    const box = document.getElementById("watchlist");
    if (!box) return;

    if (watchlist.length === 0) {
        box.innerHTML = "<p style='color:#94a3b8'>No saved items.</p>";
        return;
    }

    box.innerHTML = watchlist.map(p => `
        <div class="watch-item">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div>
                    <h4 style="margin:0 0 4px 0;">${p.title}</h4>
                    <p style="margin:0;color:#4fd1c5;font-weight:bold;">${p.price}</p>
                    <p style="margin:0;color:#94a3b8;font-size:13px;">${p.store}</p>
                </div>
                <div style="display:flex;gap:8px;">
                    <a href="${p.link}" target="_blank"
                       style="background:#1e293b;color:#4fd1c5;padding:6px 12px;border-radius:8px;text-decoration:none;font-size:13px;">
                       View →
                    </a>
                    <button onclick="removeFromWatchlist('${p.link.replace(/'/g, "\\'")}')"
                            style="background:#7f1d1d;color:#fca5a5;border:none;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:13px;">
                        Remove
                    </button>
                </div>
            </div>
        </div>
    `).join("");
}

/* ================= COMPARE ================= */
async function runCompareSearch() {
    const query = document.getElementById("searchInput")?.value.toLowerCase().trim();
    if (!query) return;

    const statusMsg = document.getElementById("statusMsg");
    if (statusMsg) statusMsg.textContent = "Searching...";

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

        const allMatches = [...a, ...f, ...m];
        renderChart(allMatches);

        if (statusMsg) {
            const total = allMatches.length;
            statusMsg.textContent = total > 0
                ? `Found ${total} result(s) across all stores.`
                : "No results found. Try a different keyword.";
        }

    } catch (err) {
        console.error("Compare error:", err);
        if (statusMsg) statusMsg.textContent = "Error loading data. Make sure JSON files are in the same folder.";
    }
}

/* ================= DISPLAY COMPARE ================= */
function displayCompare(id, products) {
    const box = document.getElementById(id);
    if (!box) return;

    if (products.length === 0) {
        box.innerHTML = "<p style='color:#94a3b8;text-align:center;padding:10px;'>No results</p>";
        return;
    }

    // Find best (lowest) price among these results for badge
    const prices = products.map(p => parsePrice(p.price));
    const minPrice = Math.min(...prices);

    box.innerHTML = products.map(p => {
        const price = parsePrice(p.price);
        const isBest = price === minPrice;
        return `
        <div class="product-card" style="margin-bottom:16px;">
            ${isBest ? '<div class="best-deal">🏷 Best Deal</div>' : ''}
            <img src="${p.thumbnail || p.image || 'https://via.placeholder.com/200'}"
                 onerror="this.onerror=null; this.src='https://via.placeholder.com/200?text=No+Image';" />
            <h3>${p.title}</h3>
            <p style="font-size:1.1rem;font-weight:bold;color:#4fd1c5;">${p.price}</p>
            <a href="${p.link}" target="_blank"
               style="display:inline-block;margin-top:8px;background:#1e293b;color:#4fd1c5;
                      padding:6px 14px;border-radius:8px;text-decoration:none;font-size:13px;">
               View →
            </a>
        </div>
        `;
    }).join("");
}

/* ================= CHART (Bar + price labels) ================= */
function renderChart(products) {
    const canvas = document.getElementById("priceChart");
    if (!canvas) return;

    if (window.chartInstance) {
        window.chartInstance.destroy();
    }

    if (products.length === 0) return;

    const storeColors = {
        "Amazon":  "rgba(255,153,0,0.8)",
        "Flipkart":"rgba(40,116,240,0.8)",
        "Meesho":  "rgba(244,51,151,0.8)"
    };

    const labels = products.map(p => p.title.length > 18 ? p.title.substring(0, 18) + "…" : p.title);
    const prices = products.map(p => parsePrice(p.price));
    const colors = products.map(p => storeColors[p.store] || "rgba(79,209,197,0.8)");

    window.chartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: labels,
            datasets: [{
                label: "Price (₹)",
                data: prices,
                backgroundColor: colors,
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: ctx => "₹" + ctx.parsed.y.toLocaleString()
                    }
                }
            },
            scales: {
                x: {
                    ticks: { color: "#94a3b8", font: { size: 11 } },
                    grid: { color: "#1e293b" }
                },
                y: {
                    ticks: {
                        color: "#94a3b8",
                        callback: val => "₹" + val.toLocaleString()
                    },
                    grid: { color: "#1e293b" }
                }
            }
        }
    });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    loadLocalData();
    displayWatchlist();
});
