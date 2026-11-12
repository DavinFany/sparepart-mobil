/* =========================================================================
   CarnivalParts — Logika website
   Data produk & toko diatur di js/products.js (tidak perlu ubah file ini)
   ========================================================================= */
(function () {
  "use strict";

  /* ---------- Ikon kategori (SVG) ---------- */
  const IKON = {
    mesin: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M10 18h6l3-4h10l3 4h4v6h4v-4h2v12h-2v-4h-4v6h-4l-4 4H18l-4-4h-4z"/><path d="M4 22v8M4 26h6"/><path d="M20 14v-4h8v4"/></svg>',
    rem: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="5"/><circle cx="24" cy="12" r="1.6" fill="currentColor"/><circle cx="35" cy="24" r="1.6" fill="currentColor"/><circle cx="24" cy="36" r="1.6" fill="currentColor"/><circle cx="13" cy="24" r="1.6" fill="currentColor"/><path d="M33 8a19 19 0 017 9" stroke-width="5"/></svg>',
    kaki: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><rect x="18" y="4" width="12" height="8" rx="2"/><path d="M22 12v6M26 12v6"/><path d="M17 18h14v4H17z"/><path d="M18 22l-4 3 20 3-20 3 20 3-20 3 16 3"/><rect x="18" y="40" width="12" height="4" rx="1"/></svg>',
    kelistrikan: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><rect x="6" y="14" width="36" height="26" rx="3"/><path d="M12 14v-4h6v4M30 14v-4h6v4"/><path d="M12 24h6M15 21v6M30 24h6"/><path d="M25 28l-3 5h4l-3 5"/></svg>',
    filter: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><ellipse cx="24" cy="10" rx="14" ry="5"/><path d="M10 10v28c0 2.8 6.3 5 14 5s14-2.2 14-5V10"/><path d="M15 16v22M20 17v23M28 17v23M33 16v22"/></svg>',
    body: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M6 30v-6l5-9a4 4 0 013.5-2h19a4 4 0 013.5 2l5 9v6a3 3 0 01-3 3H9a3 3 0 01-3-3z"/><path d="M11 24h26"/><circle cx="14" cy="36" r="4"/><circle cx="34" cy="36" r="4"/><path d="M9 28h4M35 28h4"/></svg>',
    interior: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M16 6h10a3 3 0 013 3l-2 18H15L13 9a3 3 0 013-3z"/><path d="M13 27h20a4 4 0 014 4v3H11v-3a2 2 0 012-4z"/><path d="M14 34v8M34 34v8"/></svg>',
    oli: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"><path d="M14 14h14l6 6v20a3 3 0 01-3 3H14a3 3 0 01-3-3V17a3 3 0 013-3z"/><path d="M18 14V8h6v6"/><path d="M34 20l6-4"/><path d="M22 26c-3 4-3 6 0 8 3-2 3-4 0-8z" fill="currentColor"/></svg>',
    default: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"><circle cx="24" cy="24" r="8"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M14 34l-4 4"/></svg>',
  };
  const ikonCart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.5L21 8H6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20.5" r="1.4" fill="currentColor"/><circle cx="17" cy="20.5" r="1.4" fill="currentColor"/></svg>';
  const ikonWA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z"/></svg>';

  /* ---------- Helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const kategoriById = Object.fromEntries(KATEGORI.map((k) => [k.id, k]));
  const produkById = Object.fromEntries(PRODUK.map((p) => [p.id, p]));
  const ikonProduk = (p) => IKON[(kategoriById[p.kategori] || {}).ikon] || IKON.default;
  const waLink = (text) => `https://wa.me/${TOKO.whatsapp}?text=${encodeURIComponent(text)}`;

  function media(p, cls = "") {
    return p.gambar
      ? `<img src="${esc(p.gambar)}" alt="${esc(p.nama)}" loading="lazy" class="${cls}">`
      : `<span class="ph">${ikonProduk(p)}</span>`;
  }
  function diskon(p) {
    return p.hargaCoret > p.harga ? Math.round((1 - p.harga / p.hargaCoret) * 100) : 0;
  }
  function stokLabel(p) {
    if (p.stok <= 0) return '<span class="card__stock out">Stok habis — bisa inden</span>';
    if (p.stok <= 5) return `<span class="card__stock low">Sisa ${p.stok} pcs</span>`;
    return '<span class="card__stock">Stok tersedia</span>';
  }

  /* ---------- Isi data toko ---------- */
  function isiDataToko() {
    $$("[data-toko]").forEach((el) => { el.textContent = TOKO[el.dataset.toko] || ""; });
    $$("[data-wa]").forEach((el) => {
      el.href = waLink(el.dataset.wa);
      el.target = "_blank";
      el.rel = "noopener";
    });
    $("#mapsLink").href = TOKO.mapsUrl;
    $("#igLink").href = TOKO.instagram;
    $("#year").textContent = new Date().getFullYear();
    $("#statProduk").textContent = PRODUK.length + (PRODUK.length >= 10 ? "+" : "");
    document.title = `${TOKO.nama} — ${TOKO.tagline}`;
  }

  /* ---------- State ---------- */
  const state = { kategori: "semua", cari: "", urut: "default" };

  /* ---------- Kategori ---------- */
  function renderKategori() {
    $("#catGrid").innerHTML = KATEGORI.map((k) => {
      const jumlah = PRODUK.filter((p) => p.kategori === k.id).length;
      return `<a href="#produk" class="cat" data-cat="${esc(k.id)}">
        <span class="cat__icon">${IKON[k.ikon] || IKON.default}</span>
        <span class="cat__name">${esc(k.nama)}</span>
        <span class="cat__count">${jumlah} produk</span>
      </a>`;
    }).join("");

    $("#filterChips").innerHTML = [{ id: "semua", nama: "Semua" }, ...KATEGORI]
      .map((k) => `<button class="chip${k.id === state.kategori ? " is-active" : ""}" data-cat="${esc(k.id)}" role="tab">${esc(k.nama)}</button>`)
      .join("");
  }

  function setKategori(id) {
    state.kategori = id;
    $$("#filterChips .chip").forEach((c) => c.classList.toggle("is-active", c.dataset.cat === id));
    const aktif = $(`#filterChips .chip[data-cat="${id}"]`);
    if (aktif) aktif.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    renderProduk();
  }

  /* ---------- Produk ---------- */
  function filterProduk() {
    const q = state.cari.trim().toLowerCase();
    let list = PRODUK.filter((p) => {
      if (state.kategori !== "semua" && p.kategori !== state.kategori) return false;
      if (!q) return true;
      return [p.nama, p.kodePart, p.tahun, p.kondisi, (kategoriById[p.kategori] || {}).nama]
        .join(" ").toLowerCase().includes(q);
    });
    const tersedia = (p) => (p.stok > 0 ? 0 : 1);
    const sorters = {
      default: (a, b) => tersedia(a) - tersedia(b) || (b.unggulan === true) - (a.unggulan === true),
      "harga-asc": (a, b) => a.harga - b.harga,
      "harga-desc": (a, b) => b.harga - a.harga,
      nama: (a, b) => a.nama.localeCompare(b.nama, "id"),
    };
    return list.slice().sort(sorters[state.urut]);
  }

  function kartu(p, i) {
    const d = diskon(p);
    const habis = p.stok <= 0;
    let tagKiri = "";
    if (habis) tagKiri = '<span class="tag tag--out">Habis</span>';
    else if (p.unggulan) tagKiri = '<span class="tag tag--hot">Terlaris</span>';
    const tagKanan = d ? `<span class="tag tag--disc">-${d}%</span>` : "<span></span>";
    return `<article class="card" style="animation-delay:${Math.min(i, 12) * 30}ms">
      <div class="card__media" data-detail="${esc(p.id)}">
        ${media(p)}
        <div class="card__tags">${tagKiri || "<span></span>"}${tagKanan}</div>
      </div>
      <div class="card__body">
        <div class="card__meta"><span class="cond cond--${esc(String(p.kondisi).toLowerCase())}">${esc(p.kondisi)}</span><span>${esc((kategoriById[p.kategori] || {}).nama || "")}</span></div>
        <h3 class="card__title" data-detail="${esc(p.id)}">${esc(p.nama)}</h3>
        <p class="card__fit">${esc(p.tahun)}</p>
        <div class="card__price">
          <span class="price">${rupiah(p.harga)}</span>
          ${d ? `<span class="price-old">${rupiah(p.hargaCoret)}</span>` : ""}
        </div>
        ${stokLabel(p)}
      </div>
      <div class="card__actions">
        <button class="btn btn--outline btn--detail" data-detail="${esc(p.id)}">Detail</button>
        ${habis
          ? `<a class="btn btn--primary" href="${waLink(`Halo, apakah ${p.nama} (${p.kodePart}) bisa inden?`)}" target="_blank" rel="noopener">Tanya Inden</a>`
          : `<button class="btn btn--primary" data-add="${esc(p.id)}">${ikonCart}<span>Keranjang</span></button>`}
      </div>
    </article>`;
  }

  function renderProduk() {
    const list = filterProduk();
    $("#productGrid").innerHTML = list.map(kartu).join("");
    $("#emptyState").hidden = list.length > 0;
    $("#resultInfo").textContent = `Menampilkan ${list.length} dari ${PRODUK.length} produk`;
  }

  /* ---------- Modal detail ---------- */
  let lastFocus = null;
  function bukaDetail(id) {
    const p = produkById[id];
    if (!p) return;
    const d = diskon(p);
    const habis = p.stok <= 0;
    $("#modalContent").innerHTML = `<div class="pd">
      <div class="pd__media">${media(p)}</div>
      <div class="pd__info">
        <div class="card__meta"><span class="cond cond--${esc(String(p.kondisi).toLowerCase())}">${esc(p.kondisi)}</span><span>${esc((kategoriById[p.kategori] || {}).nama || "")}</span></div>
        <h2 id="modalTitle">${esc(p.nama)}</h2>
        <div class="pd__price"><span class="price">${rupiah(p.harga)}</span>${d ? `<span class="price-old">${rupiah(p.hargaCoret)}</span><span class="tag tag--disc">-${d}%</span>` : ""}</div>
        ${stokLabel(p)}
        <p class="pd__desc">${esc(p.deskripsi)}</p>
        <table class="spec"><tbody>
          <tr><td>Nomor part</td><td>${esc(p.kodePart || "-")}</td></tr>
          <tr><td>Kecocokan</td><td>${esc(p.tahun)}</td></tr>
          <tr><td>Kondisi</td><td>${esc(p.kondisi)}</td></tr>
          <tr><td>Kode produk</td><td>${esc(p.id)}</td></tr>
        </tbody></table>
        <div class="pd__actions">
          ${habis ? "" : `<button class="btn btn--primary btn--block" data-add="${esc(p.id)}">${ikonCart}Tambah ke Keranjang</button>`}
          <a class="btn btn--wa btn--block" target="_blank" rel="noopener" href="${waLink(`Halo, saya tertarik dengan:\n*${p.nama}*\nNo. part: ${p.kodePart}\nHarga: ${rupiah(p.harga)}\n\nApakah cocok untuk mobil saya?`)}">${ikonWA}Tanya Kecocokan</a>
        </div>
      </div>
    </div>`;
    lastFocus = document.activeElement;
    $("#productModal").hidden = false;
    document.body.classList.add("no-scroll");
    $("#modalClose").focus();
  }
  function tutupDetail() {
    $("#productModal").hidden = true;
    if (!$("#cartDrawer").classList.contains("is-open")) document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Keranjang ---------- */
  const CART_KEY = "carnivalparts_cart";
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { cart = {}; }
  // buang item yang sudah tidak ada di daftar produk
  Object.keys(cart).forEach((id) => { if (!produkById[id]) delete cart[id]; });

  function simpanCart() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* abaikan */ }
  }
  function tambah(id) {
    const p = produkById[id];
    if (!p || p.stok <= 0) return;
    const qty = (cart[id] || 0) + 1;
    if (qty > p.stok) { toast(`Stok ${p.nama} hanya ${p.stok} pcs`); return; }
    cart[id] = qty;
    simpanCart(); renderCart();
    const b = $("#cartCount");
    b.classList.remove("bump"); void b.offsetWidth; b.classList.add("bump");
    toast(`✓ ${p.nama} ditambahkan`);
  }
  function ubahQty(id, delta) {
    const p = produkById[id];
    const qty = (cart[id] || 0) + delta;
    if (qty <= 0) delete cart[id];
    else if (qty > p.stok) { toast(`Stok hanya ${p.stok} pcs`); return; }
    else cart[id] = qty;
    simpanCart(); renderCart();
  }

  function renderCart() {
    const ids = Object.keys(cart);
    const totalQty = ids.reduce((s, id) => s + cart[id], 0);
    const total = ids.reduce((s, id) => s + cart[id] * produkById[id].harga, 0);
    const badge = $("#cartCount");
    badge.textContent = totalQty;
    badge.classList.toggle("show", totalQty > 0);

    if (!ids.length) {
      $("#cartItems").innerHTML = `<div class="cart-empty">${ikonCart}<p><strong>Keranjang masih kosong</strong><br>Yuk pilih sparepart untuk Carnival Anda.</p><a href="#produk" class="btn btn--outline btn--sm" data-close-cart>Lihat Produk</a></div>`;
      $("#cartFoot").hidden = true;
      return;
    }
    $("#cartFoot").hidden = false;
    $("#cartItems").innerHTML = ids.map((id) => {
      const p = produkById[id];
      return `<div class="cart-item">
        <div class="cart-item__thumb">${media(p)}</div>
        <div>
          <p class="cart-item__name">${esc(p.nama)}</p>
          <span class="cart-item__price">${rupiah(p.harga)}</span>
        </div>
        <div class="cart-item__side">
          <div class="qty">
            <button data-qty="-1" data-id="${esc(id)}" aria-label="Kurangi">−</button>
            <span>${cart[id]}</span>
            <button data-qty="1" data-id="${esc(id)}" aria-label="Tambah">+</button>
          </div>
          <button class="link-remove" data-remove="${esc(id)}">Hapus</button>
        </div>
      </div>`;
    }).join("");
    $("#cartTotal").textContent = rupiah(total);
  }

  function checkout() {
    const ids = Object.keys(cart);
    if (!ids.length) return;
    let total = 0;
    const baris = ids.map((id, i) => {
      const p = produkById[id];
      const sub = p.harga * cart[id];
      total += sub;
      return `${i + 1}. ${p.nama}\n   No. part: ${p.kodePart || "-"}\n   ${cart[id]} x ${rupiah(p.harga)} = ${rupiah(sub)}`;
    });
    const pesan = `Halo ${TOKO.nama}, saya ingin memesan:\n\n${baris.join("\n\n")}\n\n*Subtotal: ${rupiah(total)}*\n\nNama:\nAlamat kirim:\nTipe/Tahun Carnival:\n\nMohon info total dengan ongkir. Terima kasih.`;
    window.open(waLink(pesan), "_blank", "noopener");
  }

  function bukaCart() {
    $("#cartDrawer").classList.add("is-open");
    $("#cartDrawer").setAttribute("aria-hidden", "false");
    $("#overlay").hidden = false;
    document.body.classList.add("no-scroll");
  }
  function tutupCart() {
    $("#cartDrawer").classList.remove("is-open");
    $("#cartDrawer").setAttribute("aria-hidden", "true");
    $("#overlay").hidden = true;
    if ($("#productModal").hidden) document.body.classList.remove("no-scroll");
  }

  /* ---------- Toast ---------- */
  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }

  /* ---------- Menu mobile ---------- */
  function toggleMenu(force) {
    const open = typeof force === "boolean" ? force : !$("#nav").classList.contains("is-open");
    $("#nav").classList.toggle("is-open", open);
    $("#menuBtn").setAttribute("aria-expanded", String(open));
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    document.addEventListener("click", (e) => {
      const t = e.target;
      const add = t.closest("[data-add]");
      if (add) { tambah(add.dataset.add); return; }
      const det = t.closest("[data-detail]");
      if (det) { bukaDetail(det.dataset.detail); return; }
      const cat = t.closest("[data-cat]");
      if (cat) { setKategori(cat.dataset.cat); return; }
      const q = t.closest("[data-qty]");
      if (q) { ubahQty(q.dataset.id, Number(q.dataset.qty)); return; }
      const rm = t.closest("[data-remove]");
      if (rm) { delete cart[rm.dataset.remove]; simpanCart(); renderCart(); return; }
      if (t.closest("[data-close-cart]")) { tutupCart(); return; }
      if (t.closest("#nav a")) toggleMenu(false);
    });

    $("#cartBtn").addEventListener("click", bukaCart);
    $("#cartClose").addEventListener("click", tutupCart);
    $("#overlay").addEventListener("click", tutupCart);
    $("#checkoutBtn").addEventListener("click", checkout);
    $("#menuBtn").addEventListener("click", () => toggleMenu());
    $("#modalClose").addEventListener("click", tutupDetail);
    $("#productModal").addEventListener("click", (e) => { if (e.target.id === "productModal") tutupDetail(); });

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!$("#productModal").hidden) tutupDetail();
      else if ($("#cartDrawer").classList.contains("is-open")) tutupCart();
      else toggleMenu(false);
    });

    let debounce;
    $("#searchInput").addEventListener("input", (e) => {
      clearTimeout(debounce);
      debounce = setTimeout(() => { state.cari = e.target.value; renderProduk(); }, 150);
    });
    $("#sortSelect").addEventListener("change", (e) => { state.urut = e.target.value; renderProduk(); });

    const header = $("#header");
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- Init ---------- */
  isiDataToko();
  renderKategori();
  renderProduk();
  renderCart();
  bindEvents();
})();
