/**
 * KMMK Admin Static UI
 * - No build step
 * - No external libs (aside from Supabase CDN)
 * - Products & settings cached locally, orders/admins backed by Supabase
 */

// Supabase client injected from index.html (window.supabaseClient)
const supabaseClient = window.supabaseClient || null;

// Current admin session (for now, static head_admin)
const currentAdmin = {
  role: "head_admin",
  email: "admin@groove.com",
};

function isHeadAdmin() {
  return currentAdmin.role === "head_admin";
}

async function hashPassword(password) {
  if (!window.crypto?.subtle) {
    throw new Error("Web Crypto API not available");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function nowIso() {
  return new Date().toISOString();
}

function buildProductPayload(p) {
  // Full payload (requires extra columns to exist in Supabase)
  return {
    name: p.name,
    sku: p.sku || null,
    category: p.category || null,
    status: p.status || "active",
    price: p.price,
    stock: p.stock,
    image: p.imageUrl || null,
    description: p.description || null,
    updated_at: nowIso(),
  };
}

function buildMinimalProductPayload(p) {
  // Minimal payload that matches the original table schema
  return {
    name: p.name,
    price: p.price,
    stock: p.stock,
    image: p.imageUrl || null,
  };
}

const LS_KEYS = Object.freeze({
  products: "kmmk_admin_products_v1",
  orders: "kmmk_admin_orders_v1",
  settings: "kmmk_admin_settings_v1",
});

/** @returns {string} */
function uid(prefix = "") {
  const rand = Math.random().toString(16).slice(2, 8);
  const t = Date.now().toString(16);
  return `${prefix}${t}-${rand}`;
}

/** @param {unknown} n */
function money(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  // Always display Philippine pesos with a peso sign
  return "₱" + v.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** @param {Date | number | string} d */
function fmtDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return "—";
  return dt.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function safeJsonParse(s) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

function getSettings() {
  const raw = localStorage.getItem(LS_KEYS.settings);
  const parsed = raw ? safeJsonParse(raw) : null;
  return (
    parsed || {
      storeName: "Hobbies by KMMK",
      supportEmail: "hobbies.by.kmmk@gmail.com",
      currency: "PHP",
      lowStockThreshold: 5,
      taxRatePct: 0,
      shippingFlat: 0,
    }
  );
}

function setSettings(next) {
  localStorage.setItem(LS_KEYS.settings, JSON.stringify(next));
}

function getProducts() {
  const raw = localStorage.getItem(LS_KEYS.products);
  const parsed = raw ? safeJsonParse(raw) : null;
  return Array.isArray(parsed) ? parsed : [];
}

function setProducts(next) {
  localStorage.setItem(LS_KEYS.products, JSON.stringify(next));
}

// In-memory orders cache. Source of truth is Supabase.
const dataState = {
  orders: [],
};

function getOrders() {
  return dataState.orders;
}

function setOrders(next) {
  dataState.orders = Array.isArray(next) ? next : [];
}

async function seedIfEmpty() {
  // If Supabase is available, try to load products from the backend first.
  if (supabaseClient) {
    try {
      // Try loading extended product metadata if columns exist; fall back to minimal schema.
      let data = null;
      let error = null;

      const ext = await supabaseClient
        .from("products")
        .select("id, name, sku, category, status, price, stock, image, description, updated_at, created_at")
        .order("created_at", { ascending: false });

      if (ext.error) {
        const minimal = await supabaseClient
          .from("products")
          .select("id, name, price, stock, image, created_at")
          .order("created_at", { ascending: false });
        data = minimal.data;
        error = minimal.error;
      } else {
        data = ext.data;
        error = null;
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map((p) => ({
          id: p.id,
          name: p.name || "",
          sku: p.sku || "",
          category: p.category || "",
          price: Number(p.price ?? 0),
          stock: Number(p.stock ?? 0),
          status: p.status || (Number(p.stock ?? 0) > 0 ? "active" : "inactive"),
          description: p.description || "",
          imageUrl: p.image || "",
          updatedAt: p.updated_at
            ? new Date(p.updated_at).getTime()
            : p.created_at
              ? new Date(p.created_at).getTime()
              : Date.now(),
        }));
        setProducts(mapped);
        return;
      }
    } catch (err) {
      console.error("[admin-static] Failed to load products from Supabase", err);
    }
  }

  // Fallback: seed local demo data (and optionally sync to Supabase if available)
  if (getProducts().length === 0) {
    const now = Date.now();
    const demoProducts = [
      {
        id: uid("prd-"),
        name: "Vinyl — The Midnight (Deluxe)",
        sku: "VIN-MID-DELUXE",
        category: "Vinyl",
        price: 39.99,
        stock: 12,
        status: "active",
        description: "Limited deluxe pressing.",
        imageUrl: "",
        updatedAt: now,
      },
      {
        id: uid("prd-"),
        name: "Cassette — Retro Synthwave",
        sku: "CAS-SYN-001",
        category: "Cassette",
        price: 14.5,
        stock: 3,
        status: "active",
        description: "Small batch tape release.",
        imageUrl: "",
        updatedAt: now - 1000 * 60 * 60 * 2,
      },
      {
        id: uid("prd-"),
        name: "Guitar Picks (Pack of 10)",
        sku: "ACC-PICK-10",
        category: "Accessories",
        price: 6.0,
        stock: 70,
        status: "active",
        description: "Assorted thickness.",
        imageUrl: "",
        updatedAt: now - 1000 * 60 * 60 * 24,
      },
      {
        id: uid("prd-"),
        name: "Collectible Toy — Mini Figure",
        sku: "TOY-MINI-009",
        category: "Collectibles",
        price: 24.0,
        stock: 0,
        status: "inactive",
        description: "Out of stock / archived.",
        imageUrl: "",
        updatedAt: now - 1000 * 60 * 60 * 72,
      },
    ];
    setProducts(demoProducts);

    if (supabaseClient) {
      try {
        // Prefer inserting full product payload; fall back to minimal if columns don't exist.
        const fullPayload = demoProducts.map(buildProductPayload);
        const minimalPayload = demoProducts.map(buildMinimalProductPayload);

        const { error } = await supabaseClient.from("products").insert(fullPayload);
        if (error) {
          await supabaseClient.from("products").insert(minimalPayload);
        }
      } catch (err) {
        console.error("[admin-static] Failed to seed demo products into Supabase", err);
      }
    }
  }

}

// ---------- UI helpers ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(title, msg) {
  const host = $("#toasts");
  const el = document.createElement("div");
  el.className = "toast";
  el.innerHTML = `<div class="toast__title">${escapeHtml(title)}</div><div class="toast__msg">${escapeHtml(msg)}</div>`;
  host.appendChild(el);
  setTimeout(() => {
    el.style.opacity = "0";
    el.style.transform = "translateY(4px)";
    el.style.transition = "opacity .25s ease, transform .25s ease";
  }, 2200);
  setTimeout(() => el.remove(), 2550);
}

function badge(status) {
  const map = {
    active: { cls: "badge--ok", label: "Active" },
    inactive: { cls: "badge--bad", label: "Inactive" },
    pending: { cls: "badge--warn", label: "Pending" },
    processing: { cls: "badge--warn", label: "Processing" },
    completed: { cls: "badge--ok", label: "Completed" },
    cancelled: { cls: "badge--bad", label: "Cancelled" },
  };
  const v = map[status] || { cls: "", label: String(status || "—") };
  return `<span class="badge ${v.cls}"><span class="badge__dot"></span>${escapeHtml(v.label)}</span>`;
}

let modalConfig = null;

function openModal({ title, bodyHtml, footerHtml, onSubmit }) {
  const modal = $("#modal");
  $("#modalTitle").textContent = title;
  $("#modalBody").innerHTML = bodyHtml;
  $("#modalFooter").innerHTML = footerHtml;
  modalConfig = { onSubmit: typeof onSubmit === "function" ? onSubmit : null };

  modal.showModal();
  // Focus first input if present
  const first = $(".input, .select, .textarea, button", $("#modalBody"));
  if (first) first.focus();
}

function closeModal() {
  const modal = $("#modal");
  if (modal.open) modal.close();
}

function setPageTitle(s) {
  $("#pageTitle").textContent = s;
  document.title = `KMMK Admin — ${s}`;
}

// ---------- Pages ----------
const state = {
  inventoryQuery: "",
  inventoryStatus: "all",
  ordersQuery: "",
  ordersStatus: "all",
};

let ordersLoading = false;
let ordersLoaded = false;

async function loadOrdersFromSupabase(force = false) {
  if (!supabaseClient || ordersLoading || (ordersLoaded && !force)) return;

  ordersLoading = true;
  try {
    const { data: ordersRaw, error: ordersError } = await supabaseClient
      .from("orders")
      .select("id, user_id, total, status, created_at")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("[admin-static] Failed to load orders from Supabase", ordersError);
      setOrders([]);
      ordersLoaded = true;
      return;
    }

    if (!ordersRaw || ordersRaw.length === 0) {
      setOrders([]);
      ordersLoaded = true;
      return;
    }

    const orderIds = ordersRaw.map((o) => o.id);

    const { data: orderItemsRaw, error: oiError } = await supabaseClient
      .from("order_items")
      .select("order_id, product_id, quantity")
      .in("order_id", orderIds);

    if (oiError) {
      console.error("[admin-static] Failed to load order_items from Supabase", oiError);
    }

    const productIds = Array.from(
      new Set((orderItemsRaw || []).map((oi) => oi.product_id).filter(Boolean))
    );
    let productsMap = {};
    if (productIds.length) {
      const { data: productsRaw, error: productsError } = await supabaseClient
        .from("products")
        .select("id, name, price")
        .in("id", productIds);
      if (productsError) {
        console.error("[admin-static] Failed to load products for orders", productsError);
      } else if (productsRaw) {
        productsMap = Object.fromEntries(productsRaw.map((p) => [p.id, p]));
      }
    }

    const userIds = Array.from(
      new Set(ordersRaw.map((o) => o.user_id).filter(Boolean))
    );
    let usersMap = {};
    if (userIds.length) {
      const { data: usersRaw, error: usersError } = await supabaseClient
        .from("users")
        .select("id, email")
        .in("id", userIds);
      if (usersError) {
        console.error("[admin-static] Failed to load users for orders", usersError);
      } else if (usersRaw) {
        usersMap = Object.fromEntries(usersRaw.map((u) => [u.id, u]));
      }
    }

    const itemsByOrder = {};
    (orderItemsRaw || []).forEach((oi) => {
      if (!itemsByOrder[oi.order_id]) itemsByOrder[oi.order_id] = [];
      itemsByOrder[oi.order_id].push(oi);
    });

    const enriched = ordersRaw.map((o) => {
      const rawItems = itemsByOrder[o.id] || [];
      const items = rawItems.map((it) => {
        const product = productsMap[it.product_id] || {};
        const price = Number(product.price ?? 0);
        return {
          productId: it.product_id,
          name: product.name || "Unknown product",
          qty: Number(it.quantity ?? 0),
          price,
        };
      });

      const totalFromItems = items.reduce((sum, it) => sum + it.qty * it.price, 0);
      const total = Number(
        typeof o.total === "number" && Number.isFinite(o.total) ? o.total : totalFromItems
      );

      const user = o.user_id ? usersMap[o.user_id] : null;
      const email = user?.email || "—";

      return {
        id: o.id,
        userId: o.user_id,
        customerName: email,
        email,
        status: o.status || "pending",
        items,
        paymentRef: "",
        createdAt: o.created_at ? new Date(o.created_at).getTime() : Date.now(),
        total,
      };
    });

    setOrders(enriched);
    ordersLoaded = true;
  } catch (err) {
    console.error("[admin-static] Unexpected error while loading orders", err);
    setOrders([]);
    ordersLoaded = true;
  } finally {
    ordersLoading = false;
    // Re-render current route so views pick up latest data
    renderRoute();
  }
}

function renderDashboard() {
  setPageTitle("Dashboard");
  const main = $("#main");
  const products = getProducts();
  const orders = getOrders();
  const settings = getSettings();
  const low = products.filter((p) => Number(p.stock) <= Number(settings.lowStockThreshold || 0));
  const revenue = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pending = orders.length;

  const recentOrders = [...orders].sort((a, b) => Number(b.createdAt) - Number(a.createdAt)).slice(0, 6);

  main.innerHTML = `
    <div class="grid">
      <section class="card" style="grid-column: span 4;">
        <div class="card__hd">
          <div>
            <div class="card__title">Total products</div>
            <div class="card__sub">Inventory items available to manage</div>
          </div>
        </div>
        <div class="card__bd">
          <div class="kpi">
            <div class="kpi__icon" aria-hidden="true">⌗</div>
            <div>
              <div class="kpi__value">${escapeHtml(products.length)}</div>
              <div class="kpi__label">Products</div>
            </div>
          </div>
        </div>
      </section>

      <section class="card" style="grid-column: span 4;">
        <div class="card__hd">
          <div>
            <div class="card__title">Revenue</div>
            <div class="card__sub">Total from Supabase orders</div>
          </div>
        </div>
        <div class="card__bd">
          <div class="kpi">
            <div class="kpi__icon" aria-hidden="true">⟠</div>
            <div>
              <div class="kpi__value">${escapeHtml(money(revenue))}</div>
              <div class="kpi__label">Gross</div>
            </div>
          </div>
        </div>
      </section>

      <section class="card" style="grid-column: span 4;">
        <div class="card__hd">
          <div>
            <div class="card__title">Pending orders</div>
            <div class="card__sub">Needs review or payment confirmation</div>
          </div>
        </div>
        <div class="card__bd">
          <div class="kpi">
            <div class="kpi__icon" aria-hidden="true">⧉</div>
            <div>
              <div class="kpi__value">${escapeHtml(pending)}</div>
              <div class="kpi__label">Pending</div>
            </div>
          </div>
        </div>
      </section>

      <section class="card" style="grid-column: span 7;">
        <div class="card__hd">
          <div>
            <div class="card__title">Recent orders</div>
            <div class="card__sub">Quick view of latest transactions</div>
          </div>
          <div class="row">
            <a class="btn btn--ghost" href="#/orders">Open orders</a>
          </div>
        </div>
        <div class="card__bd">
          <div class="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${
                  recentOrders.length
                    ? recentOrders
                        .map(
                          (o) => `
                          <tr>
                            <td><strong>${escapeHtml(o.id)}</strong><div class="hint">${escapeHtml(o.paymentRef || "")}</div></td>
                            <td>${escapeHtml(o.customerName)}<div class="hint">${escapeHtml(o.email || "")}</div></td>
                            <td>${badge(o.status)}</td>
                            <td>${escapeHtml(money(o.total))}</td>
                            <td>${escapeHtml(fmtDate(o.createdAt))}</td>
                            <td><button class="btn btn--ghost" data-action="viewOrder" data-id="${escapeHtml(o.id)}" type="button">View</button></td>
                          </tr>`
                        )
                        .join("")
                    : `<tr><td colspan="6" class="muted">No orders yet.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section class="card" style="grid-column: span 5;">
        <div class="card__hd">
          <div>
            <div class="card__title">Low stock / attention</div>
            <div class="card__sub">Threshold: ${escapeHtml(settings.lowStockThreshold)} units</div>
          </div>
          <div class="row">
            <a class="btn btn--ghost" href="#/inventory">Open inventory</a>
          </div>
        </div>
        <div class="card__bd">
          <div class="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Stock</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${
                  low.length
                    ? low
                        .sort((a, b) => Number(a.stock) - Number(b.stock))
                        .slice(0, 8)
                        .map(
                          (p) => `
                          <tr>
                            <td><strong>${escapeHtml(p.name)}</strong><div class="hint">${escapeHtml(p.category || "")}</div></td>
                            <td>${escapeHtml(p.sku || "")}</td>
                            <td>${escapeHtml(p.stock)}</td>
                            <td><button class="btn btn--ghost" data-action="editProduct" data-id="${escapeHtml(p.id)}" type="button">Restock</button></td>
                          </tr>`
                        )
                        .join("")
                    : `<tr><td colspan="4" class="muted">No low-stock items.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `;
}

function productFormHtml(p = {}) {
  return `
    <div class="grid">
      <div class="field" style="grid-column: span 6;">
        <div class="label">Product name</div>
        <input class="input" name="name" value="${escapeHtml(p.name || "")}" placeholder="e.g., Vinyl — Album Name" required />
      </div>
      <div class="field" style="grid-column: span 6;">
        <div class="label">SKU</div>
        <input class="input" name="sku" value="${escapeHtml(p.sku || "")}" placeholder="e.g., VIN-ABC-001" required />
      </div>
      <div class="field" style="grid-column: span 4;">
        <div class="label">Category</div>
        <input class="input" name="category" value="${escapeHtml(p.category || "")}" placeholder="Vinyl / CD / Cassette / Collectibles" />
      </div>
      <div class="field" style="grid-column: span 4;">
        <div class="label">Price</div>
        <input class="input" name="price" inputmode="decimal" value="${escapeHtml(p.price ?? "")}" placeholder="0.00" required />
      </div>
      <div class="field" style="grid-column: span 4;">
        <div class="label">Stock</div>
        <input class="input" name="stock" inputmode="numeric" value="${escapeHtml(p.stock ?? "")}" placeholder="0" required />
      </div>
      <div class="field" style="grid-column: span 6;">
        <div class="label">Status</div>
        <select class="select" name="status">
          <option value="active" ${p.status === "active" ? "selected" : ""}>Active</option>
          <option value="inactive" ${p.status === "inactive" ? "selected" : ""}>Inactive</option>
        </select>
        <div class="hint">Inactive items stay in records but won’t appear as available.</div>
      </div>
      <div class="field" style="grid-column: span 6;">
        <div class="label">Image URL (optional)</div>
        <input class="input" name="imageUrl" value="${escapeHtml(p.imageUrl || "")}" placeholder="https://..." />
      </div>
      <div class="field" style="grid-column: span 12;">
        <div class="label">Description (optional)</div>
        <textarea class="textarea" name="description" placeholder="Short description">${escapeHtml(p.description || "")}</textarea>
      </div>
    </div>
  `;
}

function renderInventory() {
  setPageTitle("Inventory");
  const main = $("#main");
  const products = getProducts();
  const q = (state.inventoryQuery || "").trim().toLowerCase();
  const status = state.inventoryStatus || "all";

  const filtered = products
    .filter((p) => (status === "all" ? true : p.status === status))
    .filter((p) => {
      if (!q) return true;
      return [p.name, p.sku, p.category].some((x) => String(x || "").toLowerCase().includes(q));
    })
    .sort((a, b) => Number(b.updatedAt || 0) - Number(a.updatedAt || 0));

  main.innerHTML = `
    <div class="grid">
      <section class="card">
        <div class="card__hd">
          <div>
            <div class="card__title">Product management</div>
            <div class="card__sub">Add, edit, delete products and control inventory.</div>
          </div>
          <div class="row">
            <div class="field">
              <div class="label">Search</div>
              <input class="input" id="invSearch" value="${escapeHtml(state.inventoryQuery)}" placeholder="Search name / SKU / category" />
            </div>
            <div class="field" style="min-width: 170px;">
              <div class="label">Status</div>
              <select class="select" id="invStatus">
                <option value="all" ${status === "all" ? "selected" : ""}>All</option>
                <option value="active" ${status === "active" ? "selected" : ""}>Active</option>
                <option value="inactive" ${status === "inactive" ? "selected" : ""}>Inactive</option>
              </select>
            </div>
            <button class="btn btn--primary" data-action="addProduct" type="button">Add product</button>
          </div>
        </div>
        <div class="card__bd">
          <div class="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Updated</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered.length
                    ? filtered
                        .map(
                          (p) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml(p.name)}</strong>
                              ${p.description ? `<div class="hint">${escapeHtml(p.description)}</div>` : ""}
                            </td>
                            <td>${escapeHtml(p.sku || "")}</td>
                            <td>${escapeHtml(p.category || "")}</td>
                            <td>${badge(p.status)}</td>
                            <td>${escapeHtml(money(p.price))}</td>
                            <td>${escapeHtml(p.stock)}</td>
                            <td>${escapeHtml(fmtDate(p.updatedAt))}</td>
                            <td class="row">
                              <button class="btn btn--ghost" data-action="editProduct" data-id="${escapeHtml(p.id)}" type="button">Edit</button>
                              <button class="btn btn--danger" data-action="deleteProduct" data-id="${escapeHtml(p.id)}" type="button">Delete</button>
                            </td>
                          </tr>
                        `
                        )
                        .join("")
                    : `<tr><td colspan="8" class="muted">No products match your filters.</td></tr>`
                }
              </tbody>
            </table>
          </div>
          <div class="hint" style="margin-top:10px;">
            Tip: Use Export/Import on the left to move data between machines (still no server).
          </div>
        </div>
      </section>
    </div>
  `;

  $("#invSearch").addEventListener("input", (e) => {
    state.inventoryQuery = e.target.value;
    renderInventory();
  });
  $("#invStatus").addEventListener("change", (e) => {
    state.inventoryStatus = e.target.value;
    renderInventory();
  });
}

function renderOrders() {
  setPageTitle("Orders");
  const main = $("#main");
  const orders = getOrders();

  const q = (state.ordersQuery || "").trim().toLowerCase();
  const status = state.ordersStatus || "all";

  const filtered = orders
    .filter((o) => (status === "all" ? true : o.status === status))
    .filter((o) => {
      if (!q) return true;
      return [o.id, o.customerName, o.email, o.paymentRef]
        .some((x) => String(x || "").toLowerCase().includes(q));
    })
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  main.innerHTML = `
    <div class="grid">
      <section class="card">
        <div class="card__hd">
          <div>
            <div class="card__title">Orders & transaction data</div>
            <div class="card__sub">Manage customer orders, status, and transaction records.</div>
          </div>
          <div class="row">
            <div class="field">
              <div class="label">Search</div>
              <input class="input" id="ordSearch" value="${escapeHtml(state.ordersQuery)}" placeholder="Search order id / customer / email / payment ref" />
            </div>
            <div class="field" style="min-width: 190px;">
              <div class="label">Status</div>
              <select class="select" id="ordStatus">
                <option value="all" ${status === "all" ? "selected" : ""}>All</option>
                <option value="pending" ${status === "pending" ? "selected" : ""}>Pending</option>
                <option value="paid" ${status === "paid" ? "selected" : ""}>Paid</option>
                <option value="shipped" ${status === "shipped" ? "selected" : ""}>Shipped</option>
                <option value="cancelled" ${status === "cancelled" ? "selected" : ""}>Cancelled</option>
              </select>
            </div>
            <button class="btn btn--primary" data-action="createOrder" type="button">Create order</button>
          </div>
        </div>
        <div class="card__bd">
          <div class="tablewrap">
            <table>
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Items</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                ${
                  filtered.length
                    ? filtered
                        .map(
                          (o) => `
                          <tr>
                            <td>
                              <strong>${escapeHtml(o.id)}</strong>
                              <div class="hint">${escapeHtml(o.paymentRef || "")}</div>
                            </td>
                            <td>
                              ${escapeHtml(o.customerName)}
                              <div class="hint">${escapeHtml(o.email || "")}</div>
                            </td>
                            <td>${badge(o.status)}</td>
                            <td>${escapeHtml(money(o.total))}</td>
                            <td>${escapeHtml(
                              (o.items || [])
                                .map((it) => `${it.name} (x${it.qty})`)
                                .join(", ")
                            )}</td>
                            <td>${escapeHtml(fmtDate(o.createdAt))}</td>
                            <td class="row">
                              <button class="btn btn--ghost" data-action="viewOrder" data-id="${escapeHtml(o.id)}" type="button">View</button>
                              <button class="btn btn--ghost" data-action="updateOrderStatus" data-id="${escapeHtml(o.id)}" type="button">Status</button>
                              <button class="btn btn--danger" data-action="deleteOrder" data-id="${escapeHtml(o.id)}" type="button">Delete</button>
                            </td>
                          </tr>
                        `
                        )
                        .join("")
                    : `<tr><td colspan="7" class="muted">No orders match your filters.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `;

  $("#ordSearch").addEventListener("input", (e) => {
    state.ordersQuery = e.target.value;
    renderOrders();
  });
  $("#ordStatus").addEventListener("change", (e) => {
    state.ordersStatus = e.target.value;
    renderOrders();
  });
}

function renderContent() {
  setPageTitle("Content / Control");
  const main = $("#main");
  const s = getSettings();

  main.innerHTML = `
    <div class="grid">
      <section class="card" style="grid-column: span 7;">
        <div class="card__hd">
          <div>
            <div class="card__title">Administrative forms</div>
            <div class="card__sub">Control content and system settings (stored locally).</div>
          </div>
        </div>
        <div class="card__bd">
          <form id="settingsForm" class="grid" autocomplete="off">
            <div class="field" style="grid-column: span 6;">
              <div class="label">Store name</div>
              <input class="input" name="storeName" value="${escapeHtml(s.storeName)}" required />
            </div>
            <div class="field" style="grid-column: span 6;">
              <div class="label">Support email</div>
              <input class="input" name="supportEmail" type="email" value="${escapeHtml(s.supportEmail)}" required />
            </div>
            <div class="field" style="grid-column: span 4;">
              <div class="label">Currency</div>
              <select class="select" name="currency">
                ${["USD", "PHP", "EUR", "GBP", "JPY"].map((c) => `<option value="${c}" ${s.currency === c ? "selected" : ""}>${c}</option>`).join("")}
              </select>
            </div>
            <div class="field" style="grid-column: span 4;">
              <div class="label">Low stock threshold</div>
              <input class="input" name="lowStockThreshold" inputmode="numeric" value="${escapeHtml(s.lowStockThreshold)}" />
            </div>
            <div class="field" style="grid-column: span 4;">
              <div class="label">Tax rate (%)</div>
              <input class="input" name="taxRatePct" inputmode="decimal" value="${escapeHtml(s.taxRatePct)}" />
            </div>
            <div class="field" style="grid-column: span 6;">
              <div class="label">Flat shipping fee</div>
              <input class="input" name="shippingFlat" inputmode="decimal" value="${escapeHtml(s.shippingFlat)}" />
              <div class="hint">Used when creating demo orders.</div>
            </div>
            <div class="field" style="grid-column: span 12;">
              <div class="row">
                <button class="btn btn--primary" type="submit">Save settings</button>
                <a class="btn btn--ghost" href="#/dashboard">Back to dashboard</a>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section class="card" style="grid-column: span 5;">
        <div class="card__hd">
          <div>
            <div class="card__title">Management views</div>
            <div class="card__sub">Quick links for data monitoring.</div>
          </div>
        </div>
        <div class="card__bd">
          <div class="row">
            <a class="btn btn--ghost" href="#/inventory">Open product table</a>
            <a class="btn btn--ghost" href="#/orders">Open orders table</a>
          </div>
          <div style="height:10px"></div>
          <div class="hint">
            This static UI is designed to mimic an admin panel workflow: forms for input/control and tables for multi-record management.
          </div>
        </div>
      </section>
    </div>
  `;

  $("#settingsForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const next = {
      storeName: String(fd.get("storeName") || "").trim(),
      supportEmail: String(fd.get("supportEmail") || "").trim(),
      currency: String(fd.get("currency") || "USD"),
      lowStockThreshold: Math.max(0, Number(fd.get("lowStockThreshold") || 0)),
      taxRatePct: Math.max(0, Number(fd.get("taxRatePct") || 0)),
      shippingFlat: Math.max(0, Number(fd.get("shippingFlat") || 0)),
    };
    setSettings(next);
    toast("Saved", "Settings updated.");
    // Update money formatting in-place
    renderContent();
  });
}

function renderManageAdmin() {
  setPageTitle("Manage Admin");
  const main = $("#main");

  if (!isHeadAdmin()) {
    main.innerHTML = `
      <section class="card">
        <div class="card__hd">
          <div>
            <div class="card__title">Access denied</div>
            <div class="card__sub">Only head admins can manage admin accounts.</div>
          </div>
        </div>
        <div class="card__bd">
          <p class="muted">You do not have permission to view this page.</p>
        </div>
      </section>
    `;
    return;
  }

  main.innerHTML = `
    <div class="grid">
      <section class="card" style="grid-column: span 7;">
        <div class="card__hd">
          <div>
            <div class="card__title">Manage admin accounts</div>
            <div class="card__sub">Create manager and moderator accounts in Supabase.</div>
          </div>
        </div>
        <div class="card__bd">
          <form id="adminForm" class="grid" autocomplete="off">
            <div class="field" style="grid-column: span 6;">
              <div class="label">Email</div>
              <input class="input" name="email" type="email" placeholder="admin@example.com" required />
            </div>
            <div class="field" style="grid-column: span 6;">
              <div class="label">Password</div>
              <input class="input" name="password" type="password" placeholder="Temporary password" required />
              <div class="hint">This will be stored in the users table as plain text for now.</div>
            </div>
            <div class="field" style="grid-column: span 6;">
              <div class="label">Role</div>
              <select class="select" name="role" required>
                <option value="manager">Manager</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
            <div class="field" style="grid-column: span 12;">
              <div class="row">
                <button class="btn btn--primary" type="submit">Create admin account</button>
                <a class="btn btn--ghost" href="#/dashboard">Back to dashboard</a>
              </div>
            </div>
          </form>
          <div style="height:16px"></div>
          <div class="hint">Existing admin accounts</div>
          <div class="tablewrap" style="margin-top:8px;">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody id="adminTableBody">
                <tr><td colspan="4" class="muted">Loading admins…</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  `;

  async function refreshAdmins() {
    const tbody = $("#adminTableBody");
    if (!tbody) return;
  if (!supabaseClient) {
      tbody.innerHTML = `<tr><td colspan="4" class="muted">Supabase not configured.</td></tr>`;
      return;
    }

    try {
      const { data, error } = await supabaseClient
        .from("users")
        .select("id, email, role, created_at")
        .in("role", ["head_admin", "manager", "moderator"])
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        tbody.innerHTML = `<tr><td colspan="4" class="muted">Failed to load admins.</td></tr>`;
        return;
      }

      if (!data || data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="muted">No admin accounts found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data
        .map(
          (u) => `
          <tr>
            <td>${escapeHtml(u.email || "")}</td>
            <td>${escapeHtml(u.role || "")}</td>
            <td>${escapeHtml(fmtDate(u.created_at || new Date()))}</td>
            <td class="row">
              ${
                u.role === "head_admin"
                  ? `<span class="muted">Head admin</span>`
                  : `<button class="btn btn--danger" type="button" data-action="deleteAdmin" data-id="${escapeHtml(
                      u.id
                    )}" data-role="${escapeHtml(u.role || "")}">Delete</button>`
              }
            </td>
          </tr>
        `
        )
        .join("");
    } catch (err) {
      console.error(err);
      tbody.innerHTML = `<tr><td colspan="4" class="muted">Failed to load admins.</td></tr>`;
    }
  }

  refreshAdmins();

  $("#adminForm").addEventListener("submit", (e) => {
    e.preventDefault();
    if (!supabaseClient) {
      toast("Not configured", "Supabase is not configured for admin management.");
      return;
    }

    const fd = new FormData(e.target);
    const email = String(fd.get("email") || "").trim();
    const password = String(fd.get("password") || "").trim();
    const role = String(fd.get("role") || "manager");

    if (!email || !password) {
      toast("Missing fields", "Please provide email and password.");
      return;
    }

    confirmDelete({
      title: "Create admin account?",
      message: `This will create a new "${role}" account for ${email}.`,
      confirmText: "Create",
      danger: false,
      onConfirm: async () => {
        try {
          const hashed = await hashPassword(password);
          const { error } = await supabaseClient.from("users").insert({
            email,
            password: hashed,
            role,
          });
          if (error) {
            console.error(error);
            toast("Error", "Failed to create admin account.");
            return;
          }
          (e.target).reset();
          toast("Created", "Admin account created.");
          await refreshAdmins();
        } catch (err) {
          console.error(err);
          toast("Error", "Unexpected error while creating admin account.");
        }
      },
    });
  });
}

// ---------- Actions ----------
function upsertProduct(existingId = null) {
  const products = getProducts();
  const current = existingId ? products.find((p) => p.id === existingId) : null;
  openModal({
    title: existingId ? "Edit product" : "Add product",
    bodyHtml: productFormHtml(current || { status: "active", price: "", stock: "" }),
    footerHtml: `
      <button class="btn btn--ghost" type="button" data-close="modal">Cancel</button>
      <button class="btn btn--primary" type="submit">Save product</button>
    `,
    onSubmit: async (fd) => {
      const name = String(fd.get("name") || "").trim();
      const sku = String(fd.get("sku") || "").trim();
      const category = String(fd.get("category") || "").trim();
      const price = Number(fd.get("price"));
      const stock = Number(fd.get("stock"));
      const status = String(fd.get("status") || "active");
      const imageUrl = String(fd.get("imageUrl") || "").trim();
      const description = String(fd.get("description") || "").trim();

      if (!name || !sku || !Number.isFinite(price) || !Number.isFinite(stock)) {
        toast("Missing fields", "Please provide Name, SKU, Price, and Stock.");
        return;
      }

      const skuClash = products.some((p) => p.sku === sku && p.id !== existingId);
      if (skuClash) {
        toast("SKU exists", "SKU must be unique.");
        return;
      }

      const now = Date.now();
      const next = {
        id: existingId || uid("prd-"),
        name,
        sku,
        category,
        price,
        stock,
        status: status === "inactive" ? "inactive" : "active",
        imageUrl,
        description,
        updatedAt: now,
      };

      // Sync with Supabase products table when available
      if (supabaseClient) {
        try {
          if (existingId) {
            const full = buildProductPayload(next);
            const minimal = buildMinimalProductPayload(next);

            const { error } = await supabaseClient
              .from("products")
              .update(full)
              .eq("id", existingId);

            if (error) {
              await supabaseClient
                .from("products")
                .update(minimal)
                .eq("id", existingId);
            }
          } else {
            const full = buildProductPayload(next);
            const minimal = buildMinimalProductPayload(next);

            const inserted = await supabaseClient
              .from("products")
              .insert(full)
              .select("id")
              .single();

            if (inserted.error) {
              const fallback = await supabaseClient
                .from("products")
                .insert(minimal)
                .select("id")
                .single();
              if (!fallback.error && fallback.data?.id) {
                next.id = fallback.data.id;
              }
            } else if (inserted.data?.id) {
              next.id = inserted.data.id;
            }

          }
        } catch (err) {
          console.error("[admin-static] Failed to sync product with Supabase", err);
        }
      }

      const out = existingId ? products.map((p) => (p.id === existingId ? next : p)) : [next, ...products];
      setProducts(out);
      closeModal();
      toast("Saved", existingId ? "Product updated." : "Product added.");
      renderInventory();
    },
  });
}

function confirmDelete({ title, message, confirmText = "Delete", danger = true, onConfirm }) {
  openModal({
    title,
    bodyHtml: `<div class="muted">${escapeHtml(message)}</div>`,
    footerHtml: `
      <button class="btn btn--ghost" type="button" data-close="modal">Cancel</button>
      <button class="btn ${danger ? "btn--danger" : "btn--primary"}" id="confirmBtn" type="button">${escapeHtml(confirmText)}</button>
    `,
  });
  $("#confirmBtn").addEventListener("click", () => {
    onConfirm?.();
    closeModal();
  });
}

function viewOrder(orderId) {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return;

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsHtml = items
    .map(
      (it) => `
      <tr>
        <td><strong>${escapeHtml(it.name)}</strong></td>
        <td>${escapeHtml(it.qty)}</td>
        <td>${escapeHtml(money(it.price))}</td>
        <td>${escapeHtml(money(Number(it.qty) * Number(it.price)))}</td>
      </tr>`
    )
    .join("");

  openModal({
    title: "Order details",
    bodyHtml: `
      <div class="split">
        <div class="card" style="box-shadow:none;">
          <div class="card__hd">
            <div>
              <div class="card__title">${escapeHtml(order.id)}</div>
              <div class="card__sub">${escapeHtml(fmtDate(order.createdAt))}</div>
            </div>
            <div>${badge(order.status)}</div>
          </div>
          <div class="card__bd">
            <div class="row">
              <div class="field" style="min-width: 240px;">
                <div class="label">Customer</div>
                <div><strong>${escapeHtml(order.customerName)}</strong></div>
                <div class="hint">${escapeHtml(order.email || "")}</div>
              </div>
              <div class="field" style="min-width: 220px;">
                <div class="label">Payment reference</div>
                <div><strong>${escapeHtml(order.paymentRef || "—")}</strong></div>
              </div>
              <div class="field" style="min-width: 160px;">
                <div class="label">Total</div>
                <div><strong>${escapeHtml(money(order.total))}</strong></div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div class="hint">Items</div>
          <div class="tablewrap" style="margin-top:8px;">
            <table style="min-width: 520px;">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Line total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || `<tr><td colspan="4" class="muted">No items.</td></tr>`}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `,
    footerHtml: `
      <button class="btn btn--ghost" type="button" data-close="modal">Close</button>
      <button class="btn btn--ghost" data-action="updateOrderStatus" data-id="${escapeHtml(order.id)}" type="button">Update status</button>
    `,
  });
}

function updateOrderStatus(orderId) {
  const order = getOrders().find((o) => o.id === orderId);
  if (!order) return;
  openModal({
    title: "Update order status",
    bodyHtml: `
      <div class="field">
        <div class="label">Status</div>
        <select class="select" name="status">
          ${["pending", "processing", "completed", "cancelled"]
            .map((s) => `<option value="${s}" ${order.status === s ? "selected" : ""}>${s}</option>`)
            .join("")}
        </select>
        <div class="hint">Use this to manage order lifecycle and transaction data.</div>
      </div>
    `,
    footerHtml: `
      <button class="btn btn--ghost" type="button" data-close="modal">Cancel</button>
      <button class="btn btn--primary" type="submit">Save</button>
    `,
    onSubmit: async (fd) => {
      const nextStatus = String(fd.get("status") || "pending");

      if (!supabaseClient) {
        toast("Not configured", "Supabase is not configured for orders.");
        return;
      }

      try {
        const { error } = await supabaseClient
          .from("orders")
          .update({ status: nextStatus })
          .eq("id", orderId);

        if (error) {
          console.error(error);
          toast("Error", "Failed to update order status.");
          return;
        }

        const orders = getOrders();
        setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
        closeModal();
        toast("Updated", "Order status updated.");
        renderOrders();
      } catch (err) {
        console.error(err);
        toast("Error", "Unexpected error while updating status.");
      }
    },
  });
}

function createOrder() {
  const products = getProducts().filter((p) => p.status === "active");
  const options = products
    .map((p) => `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)} — ${escapeHtml(p.sku)}</option>`)
    .join("");

  openModal({
    title: "Create order",
    bodyHtml: `
      <div class="grid">
        <div class="field" style="grid-column: span 6;">
          <div class="label">Customer name</div>
          <input class="input" name="customerName" placeholder="e.g., Jane Doe" required />
        </div>
        <div class="field" style="grid-column: span 6;">
          <div class="label">Customer email</div>
          <input class="input" name="email" type="email" placeholder="jane@example.com" required />
        </div>
        <div class="field" style="grid-column: span 8;">
          <div class="label">Product</div>
          <select class="select" name="productId" required>
            ${options || `<option value="">No active products available</option>`}
          </select>
        </div>
        <div class="field" style="grid-column: span 4;">
          <div class="label">Quantity</div>
          <input class="input" name="qty" inputmode="numeric" value="1" required />
        </div>
        <div class="field" style="grid-column: span 6;">
          <div class="label">Status</div>
          <select class="select" name="status">
            ${["pending", "processing", "completed", "cancelled"]
              .map((s) => `<option value="${s}">${s}</option>`)
              .join("")}
          </select>
        </div>
        <div class="field" style="grid-column: span 6;">
          <div class="label">Payment reference</div>
          <input class="input" name="paymentRef" placeholder="PAY-12345" />
        </div>
      </div>
    `,
    footerHtml: `
      <button class="btn btn--ghost" type="button" data-close="modal">Cancel</button>
      <button class="btn btn--primary" type="submit">Create</button>
    `,
    onSubmit: async (fd) => {
      const customerName = String(fd.get("customerName") || "").trim();
      const email = String(fd.get("email") || "").trim();
      const productId = String(fd.get("productId") || "");
      const qty = Number(fd.get("qty") || 1);
      const status = String(fd.get("status") || "pending");
      const paymentRef = String(fd.get("paymentRef") || "").trim();

      if (!customerName || !email || !productId || !Number.isFinite(qty) || qty <= 0) {
        toast("Missing fields", "Please provide customer info, product and quantity.");
        return;
      }
      const product = getProducts().find((p) => p.id === productId);
      if (!product) {
        toast("Invalid product", "Selected product was not found.");
        return;
      }

      const settings = getSettings();
      const items = [{ productId: product.id, name: product.name, qty, price: Number(product.price) || 0 }];
      const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
      const tax = subtotal * (Number(settings.taxRatePct) / 100);
      const shipping = Number(settings.shippingFlat) || 0;
      const total = Math.max(0, subtotal + tax + shipping);

      if (!supabaseClient) {
        toast("Not configured", "Supabase is not configured for orders.");
        return;
      }

      try {
        // Ensure user exists
        let userId = null;
        const { data: existingUser, error: userErr } = await supabaseClient
          .from("users")
          .select("id")
          .eq("email", email)
          .limit(1)
          .maybeSingle();

        if (userErr && userErr.code !== "PGRST116") {
          console.error(userErr);
          toast("Error", "Failed to look up customer.");
          return;
        }

        if (existingUser?.id) {
          userId = existingUser.id;
        } else {
          const { data: newUser, error: createUserErr } = await supabaseClient
            .from("users")
            .insert({ email, role: "user" })
            .select("id")
            .single();
          if (createUserErr || !newUser?.id) {
            console.error(createUserErr);
            toast("Error", "Failed to create customer.");
            return;
          }
          userId = newUser.id;
        }

        const { data: orderRow, error: orderErr } = await supabaseClient
          .from("orders")
          .insert({
            user_id: userId,
            total,
          })
          .select("id")
          .single();
        if (orderErr || !orderRow?.id) {
          console.error(orderErr);
          toast("Error", "Failed to create order.");
          return;
        }

        const orderId = orderRow.id;

        const { error: itemsErr } = await supabaseClient
          .from("order_items")
          .insert({
            order_id: orderId,
            product_id: product.id,
            quantity: qty,
          });
        if (itemsErr) {
          console.error(itemsErr);
          toast("Error", "Failed to create order items.");
          return;
        }

        // Refresh orders from Supabase so UI reflects new order
        await loadOrdersFromSupabase(true);
        closeModal();
        toast("Created", "Order added.");
      } catch (err) {
        console.error(err);
        toast("Error", "Unexpected error while creating order.");
      }
    },
  });
}

// ---------- Routing / global handlers ----------
function currentRoute() {
  const hash = location.hash || "#/dashboard";
  const r = hash.replace(/^#\//, "").split("?")[0].trim();
  return r || "dashboard";
}

function setActiveNav(route) {
  $$(".nav__item").forEach((a) => {
    const adminOnly = a.dataset.adminOnly === "true";
    if (adminOnly && !isHeadAdmin()) {
      a.style.display = "none";
      a.removeAttribute("aria-current");
      return;
    }

    a.style.display = "";
    if (a.dataset.route === route) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
}

function renderRoute() {
  const route = currentRoute();
  setActiveNav(route);
  if (route === "dashboard") renderDashboard();
  else if (route === "inventory") renderInventory();
  else if (route === "orders") renderOrders();
  else if (route === "content") renderContent();
  else if (route === "admin" && isHeadAdmin()) renderManageAdmin();
  else {
    location.hash = "#/dashboard";
  }
  $("#main").focus();
}

function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    products: getProducts(),
    orders: getOrders(),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `kmmk-admin-export-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast("Exported", "Downloaded JSON export.");
}

async function importData(file) {
  const text = await file.text();
  const parsed = safeJsonParse(text);
  if (!parsed || typeof parsed !== "object") {
    toast("Import failed", "Invalid JSON file.");
    return;
  }

  if (parsed.settings) setSettings(parsed.settings);
  if (Array.isArray(parsed.products)) setProducts(parsed.products);
  // Orders now come from Supabase; ignore imported orders payload.

  toast("Imported", "Data imported successfully.");
  renderRoute();
}

function resetDemoData() {
  confirmDelete({
    title: "Reset demo data?",
    message: "This will clear products, orders and settings stored in your browser and restore demo data.",
    confirmText: "Reset",
    danger: true,
    onConfirm: () => {
      localStorage.removeItem(LS_KEYS.products);
      localStorage.removeItem(LS_KEYS.orders);
      localStorage.removeItem(LS_KEYS.settings);
      seedIfEmpty();
      toast("Reset", "Demo data restored.");
      renderRoute();
    },
  });
}

function bindGlobalClicks() {
  document.addEventListener("click", (e) => {
    const t = e.target;
    const btn = t && t.closest ? t.closest("[data-action]") : null;
    if (!btn) return;

    const action = btn.dataset.action;
    const id = btn.dataset.id || null;

    if (action === "addProduct") upsertProduct(null);
    if (action === "editProduct") upsertProduct(id);
    if (action === "deleteProduct") {
      const product = getProducts().find((p) => p.id === id);
      if (!product) return;
      confirmDelete({
        title: "Delete product?",
        message: `This will remove "${product.name}" (${product.sku}) from inventory.`,
        onConfirm: async () => {
          if (supabaseClient) {
            try {
              await supabaseClient.from("products").delete().eq("id", id);
            } catch (err) {
              console.error("[admin-static] Failed to delete product in Supabase", err);
            }
          }
          setProducts(getProducts().filter((p) => p.id !== id));
          toast("Deleted", "Product removed.");
          renderInventory();
        },
      });
    }

    if (action === "viewOrder") viewOrder(id);
    if (action === "updateOrderStatus") updateOrderStatus(id);
    if (action === "deleteAdmin") {
      const role = btn.dataset.role || "";
      if (role === "head_admin") {
        toast("Not allowed", "Head admin accounts cannot be deleted.");
        return;
      }
      confirmDelete({
        title: "Delete admin account?",
        message: "This will remove the selected admin account.",
        confirmText: "Delete",
        danger: true,
        onConfirm: async () => {
          if (!supabaseClient) {
            toast("Not configured", "Supabase is not configured for admin management.");
            return;
          }
          try {
          const { error } = await supabaseClient.from("users").delete().eq("id", id);
            if (error) {
              console.error(error);
              toast("Error", "Failed to delete admin account.");
              return;
            }
            toast("Deleted", "Admin account deleted.");
            renderManageAdmin();
          } catch (err) {
            console.error(err);
            toast("Error", "Unexpected error while deleting admin account.");
          }
        },
      });
      return;
    }
    if (action === "deleteOrder") {
      const order = getOrders().find((o) => o.id === id);
      if (!order) return;
      confirmDelete({
        title: "Delete order?",
        message: `This will delete order ${order.id} for ${order.customerName}.`,
        onConfirm: async () => {
          if (supabaseClient) {
            try {
              await supabaseClient.from("order_items").delete().eq("order_id", id);
              await supabaseClient.from("orders").delete().eq("id", id);
            } catch (err) {
              console.error("[admin-static] Failed to delete order in Supabase", err);
            }
          }
          setOrders(getOrders().filter((o) => o.id !== id));
          toast("Deleted", "Order removed.");
          renderOrders();
        },
      });
    }

    if (action === "createOrder") createOrder();
  });
}

function initSidebarToggle() {
  const app = $("#app");
  const toggleBtn = $("#sidebarToggle");
  if (!app || !toggleBtn) return;

  const mq = window.matchMedia("(max-width: 980px)");

  toggleBtn.addEventListener("click", () => {
    if (mq.matches) {
      // On mobile, slide the sidebar in/out.
      app.classList.toggle("sidebar-open");
    } else {
      // On desktop, collapse/expand the sidebar while keeping it visible.
      app.classList.toggle("sidebar-collapsed");
    }
  });
  // Close sidebar after navigation click on mobile
  $("#nav").addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    app.classList.remove("sidebar-open");
  });
}

function initImportExportReset() {
  $("#exportBtn").addEventListener("click", exportData);
  $("#resetBtn").addEventListener("click", resetDemoData);
  $("#importFile").addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = ""; // allow re-import same file later
    if (!file) return;
    await importData(file);
  });
}

function initAdminDropdown() {
  const trigger = $("#adminUserTrigger");
  const menu = $("#adminUserMenu");
  const logoutBtn = $("#adminLogoutBtn");
  if (!trigger || !menu || !logoutBtn) return;

  const storeAdminLoginUrl = window.STORE_ADMIN_LOGIN_URL || "http://localhost:5173/admin-login";

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = !menu.hidden;
    menu.hidden = isOpen;
    trigger.setAttribute("aria-expanded", !isOpen);
  });

  logoutBtn.addEventListener("click", () => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    window.location.href = storeAdminLoginUrl;
  });

  document.addEventListener("click", () => {
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  });
}

// ---------- Boot ----------
seedIfEmpty();
if (supabaseClient) {
  // Load orders from Supabase on startup
  loadOrdersFromSupabase().catch((err) => {
    console.error("[admin-static] Failed to load orders on boot", err);
  });
}

// Single modal submit handler (supports Enter-to-submit and dynamic modal actions)
$("#modalForm").addEventListener("submit", (e) => {
  if (!modalConfig?.onSubmit) return;
  e.preventDefault();
  modalConfig.onSubmit(new FormData(e.target));
});

// Allow closing dialog by clicking on the dimmed backdrop
$("#modal").addEventListener("click", (e) => {
  if (e.target === e.currentTarget) {
    modalConfig = null;
    closeModal();
  }
});

// Close modal when clicking explicit close buttons
document.addEventListener("click", (e) => {
  const t = e.target;
  if (!(t instanceof HTMLElement)) return;
  if (t.id === "modalClose" || t.closest("[data-close='modal']")) {
    modalConfig = null;
    closeModal();
  }
});

bindGlobalClicks();
initSidebarToggle();
initImportExportReset();
initAdminDropdown();
window.addEventListener("hashchange", renderRoute);
if (!location.hash) location.hash = "#/dashboard";
renderRoute();

