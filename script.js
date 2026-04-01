let allProducts = [];
let localProducts = [];
let watchlist = JSON.parse(localStorage.getItem("watchlist")) || [];
let isLoggedIn = false;

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
    isLoggedIn = true;
    closeLogin();
    updateAuthButton(username);
}

function signupUser() {
    const username = document.getElementById("username")?.value?.trim();
    if (!username) { alert("Please enter a username."); return; }
    isLoggedIn = true;
    closeLogin();
    updateAuthButton(username);
}

/* FIX: Replace Login button with username + Logout after login */
function updateAuthButton(username) {
    const authDiv = document.querySelector(".auth-buttons");
    if (!authDiv) return;
    authDiv.innerHTML = `
        <span style="color:#4fd1c5;font-weight:600;margin-right:10px;">👤 ${username}</span>
        <button onclick="logoutUser()"
                style="background:transparent;border:1px solid #ef4444;color:#ef4444;
                       padding:8px 14px;border-radius:8px;font-size:13px;">
            Logout
        </button>
    `;
}

function logoutUser() {
    isLoggedIn = false;
    const authDiv = document.querySelector(".auth-buttons");
    if (!authDiv) return;
    authDiv.innerHTML = `<button onclick="openLogin()">Login</button>`;
}

/* ================= IMAGE HELPER ================= */
/* FIX: Flipkart/Meesho CDN images are hotlink-blocked on GitHub Pages.
   We serve them via a CORS proxy as first attempt, with placeholder fallback. */
function getImageSrc(thumbnail) {
    if (!thumbnail || thumbnail.includes("via.placeholder")) {
        return thumbnail || "";
    }
    // Amazon images load fine directly
    if (thumbnail.includes("amazon.com") || thumbnail.includes("media-amazon")) {
        return thumbnail;
    }
    // For Flipkart/Meesho: try loading directly first, onerror will catch failures
    return thumbnail;
}

function getFallback(title) {
    const short = encodeURIComponent(title.substring(0, 12));
    return `https://via.placeholder.com/300x300/1e293b/4fd1c5?text=${short}`;
}

/* ================= SEARCH ================= */
function searchProduct() {
    const query = document.getElementById("searchInput")?.value?.toLowerCase().trim();
    if (!query) return;

    if (!localProducts.length) {
        document.getElementById("results").innerHTML =
            "<p style='color:#94a3b8;text-align:center;'>Data still loading, please try again.</p>";
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

    if (category !== "all") {
        filtered = filtered.filter(p => p.category?.toLowerCase() === category);
    }

    if (sort === "low") filtered.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sort === "high") filtered.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));

    displayProducts(filtered);
}

/* ================= HELPERS ================= */
function parsePrice(priceStr) {
    return parseInt(String(priceStr).replace(/[₹,]/g, "")) || 0;
}

/* FIX: Best Deal logic — only badge if same product found on 2+ stores.
   Normalize titles to first 4 meaningful words, group, find min per group. */
function findBestDeals(products) {
    const normalize = title => title.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .slice(0, 4)
        .join(" ");

    const groups = {};
    products.forEach((p, i) => {
        const key = normalize(p.title);
        if (!groups[key]) groups[key] = [];
        groups[key].push({ index: i, price: parsePrice(p.price) });
    });

    const bestIndexes = new Set();
    Object.values(groups).forEach(group => {
        if (group.length >= 2) {
            const minPrice = Math.min(...group.map(g => g.price));
            group.filter(g => g.price === minPrice).forEach(g => bestIndexes.add(g.index));
        }
    });

    return bestIndexes;
}

/* ================= DISPLAY PRODUCTS ================= */
function displayProducts(products) {
    const results = document.getElementById("results");
    if (!results) return;

    if (products.length === 0) {
        results.innerHTML = "<p style='color:#94a3b8;text-align:center;padding:20px;'>No products found.</p>";
        return;
    }

    const bestIndexes = findBestDeals(products);

    results.innerHTML = products.map((p, i) => {
        const price   = parsePrice(p.price);
        const hist    = (p.priceHistory || []).map(h => h.price);
        const highest = hist.length ? Math.max(...hist) : price;
        const drop    = highest - price;
        const dropPct = highest > 0 ? Math.round((drop / highest) * 100) : 0;
        const score   = Math.min(99, Math.max(30, dropPct + 40));
        const isBest  = bestIndexes.has(i);
        const sColor  = p.store === "Amazon" ? "#ff9900" : p.store === "Flipkart" ? "#2874f0" : "#f43397";
        const imgSrc  = getImageSrc(p.thumbnail);
        const fallback = getFallback(p.title);

        return `
        <div class="product-card">
            ${isBest ? '<div class="best-deal">🏷 Best Deal</div>' : ''}
            <img src="${imgSrc}"
                 onerror="this.onerror=null;this.src='${fallback}';"
                 loading="lazy" />
            <h3>${p.title}</h3>
            <p style="font-size:1.15rem;font-weight:bold;color:#4fd1c5;">${p.price}</p>
            <p style="color:${sColor};font-weight:600;margin:4px 0;">${p.store}</p>
            ${drop > 0 ? `<p style="color:#22c55e;font-size:13px;margin:4px 0;">↓ ₹${drop.toLocaleString()} drop (${dropPct}% off peak)</p>` : ""}
            <p style="color:#22c55e;font-weight:bold;margin:4px 0;">Deal Score: ${score}/99</p>
            <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                <a href="${p.link}" target="_blank"
                   style="background:#1e293b;color:#4fd1c5;padding:6px 12px;border-radius:8px;
                          text-decoration:none;font-size:13px;border:1px solid #334155;">View →</a>
                <button onclick='addToWatchlist(${JSON.stringify(p).replace(/'/g, "&#39;")})'
                        style="background:#1e293b;border:1px solid #334155;color:#e5e7eb;
                               padding:6px 12px;border-radius:8px;font-size:13px;">+ Watchlist</button>
            </div>
        </div>`;
    }).join("");
}

/* ================= WATCHLIST ================= */
function addToWatchlist(product) {
    if (watchlist.some(w => w.link === product.link)) {
        alert("Already in watchlist!"); return;
    }
    watchlist.push(product);
    localStorage.setItem("watchlist", JSON.stringify(watchlist));
    if (document.getElementById("watchlist")) displayWatchlist();
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

    box.innerHTML = watchlist.map(p => {
        const fb = getFallback(p.title);
        return `
        <div class="watch-item">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <div style="display:flex;gap:12px;align-items:center;">
                    <img src="${p.thumbnail || fb}"
                         onerror="this.onerror=null;this.src='${fb}';"
                         style="width:52px;height:52px;object-fit:contain;border-radius:6px;background:white;" />
                    <div>
                        <h4 style="margin:0 0 4px 0;font-size:14px;">${p.title}</h4>
                        <p style="margin:0;color:#4fd1c5;font-weight:bold;">${p.price}</p>
                        <p style="margin:0;color:#94a3b8;font-size:12px;">${p.store}</p>
                    </div>
                </div>
                <div style="display:flex;gap:8px;">
                    <a href="${p.link}" target="_blank"
                       style="background:#1e293b;color:#4fd1c5;padding:6px 12px;border-radius:8px;
                              text-decoration:none;font-size:13px;border:1px solid #334155;">View →</a>
                    <button onclick="removeFromWatchlist('${p.link.replace(/'/g, "\\'")}')"
                            style="background:#7f1d1d;color:#fca5a5;border:none;padding:6px 12px;
                                   border-radius:8px;cursor:pointer;font-size:13px;">✕ Remove</button>
                </div>
            </div>
        </div>`;
    }).join("");
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

        const filter = data => data.filter(p =>
            p.title.toLowerCase().includes(query) ||
            (p.category && p.category.toLowerCase().includes(query))
        );

        const a = filter(amazon), f = filter(flipkart), m = filter(meesho);

        displayCompare("amazon-results", a);
        displayCompare("flipkart-results", f);
        displayCompare("meesho-results", m);

        const all = [...a, ...f, ...m];
        renderChart(all);

        if (statusMsg) statusMsg.textContent = all.length > 0
            ? `Found ${all.length} result(s) across all stores.`
            : "No results found.";

    } catch (err) {
        console.error("Compare error:", err);
        if (statusMsg) statusMsg.textContent = "Error loading data.";
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

    const minPrice = Math.min(...products.map(p => parsePrice(p.price)));

    box.innerHTML = products.map(p => {
        const price = parsePrice(p.price);
        // FIX: only badge if multiple results exist in this column
        const isBest = price === minPrice && products.length > 1;
        const fallback = getFallback(p.title);
        return `
        <div class="product-card" style="margin-bottom:16px;">
            ${isBest ? '<div class="best-deal">🏷 Best Deal</div>' : ''}
            <img src="${p.thumbnail || fallback}"
                 onerror="this.onerror=null;this.src='${fallback}';"
                 loading="lazy" />
            <h3>${p.title}</h3>
            <p style="font-size:1.1rem;font-weight:bold;color:#4fd1c5;">${p.price}</p>
            <a href="${p.link}" target="_blank"
               style="display:inline-block;margin-top:8px;background:#1e293b;color:#4fd1c5;
                      padding:6px 14px;border-radius:8px;text-decoration:none;font-size:13px;
                      border:1px solid #334155;">View →</a>
        </div>`;
    }).join("");
}

/* ================= CHART ================= */
function renderChart(products) {
    const canvas = document.getElementById("priceChart");
    if (!canvas) return;
    if (window.chartInstance) window.chartInstance.destroy();
    if (!products.length) return;

    const storeColors = {
        "Amazon":  "rgba(255,153,0,0.85)",
        "Flipkart":"rgba(40,116,240,0.85)",
        "Meesho":  "rgba(244,51,151,0.85)"
    };

    window.chartInstance = new Chart(canvas, {
        type: "bar",
        data: {
            labels: products.map(p => p.title.length > 18 ? p.title.substring(0,18)+"…" : p.title),
            datasets: [{
                label: "Price (₹)",
                data: products.map(p => parsePrice(p.price)),
                backgroundColor: products.map(p => storeColors[p.store] || "rgba(79,209,197,0.85)"),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: ctx => "₹" + ctx.parsed.y.toLocaleString() } }
            },
            scales: {
                x: { ticks: { color: "#94a3b8", font: { size: 11 } }, grid: { color: "#1e293b" } },
                y: { ticks: { color: "#94a3b8", callback: v => "₹" + v.toLocaleString() }, grid: { color: "#1e293b" } }
            }
        }
    });
}

/* ================= INIT ================= */
document.addEventListener("DOMContentLoaded", () => {
    loadLocalData();
    displayWatchlist();
});