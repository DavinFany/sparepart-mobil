/* =========================================================================
   Logika website toko (tidak perlu diubah).
   Isi toko, mobil, kategori & produk ada di data/data.js — ubah lewat /admin.html
   ========================================================================= */
(function () {
  "use strict";

  const DATA = window.TOKO_DATA || { toko: {}, mobil: [], kategori: [], produk: [] };
  const TOKO = DATA.toko || {};
  const MOBIL = DATA.mobil || [];
  const KATEGORI = DATA.kategori || [];
  const PRODUK = (DATA.produk || []).filter((p) => p.aktif !== false);
  const IKON = window.IKON;

  const ikonCart = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h2l2.4 11.2a2 2 0 002 1.6h7.7a2 2 0 002-1.5L21 8H6.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="10" cy="20.5" r="1.4" fill="currentColor"/><circle cx="17" cy="20.5" r="1.4" fill="currentColor"/></svg>';
  const ikonWA = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2a10 10 0 00-8.6 15.1L2 22l5-1.3A10 10 0 1012 2zm4.5 12.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1-.3.2-.5.1a6.7 6.7 0 01-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 00-.7.3 3 3 0 00-.9 2.2 5.2 5.2 0 001.1 2.7 11.8 11.8 0 004.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 001.8-1.2 2.2 2.2 0 00.1-1.2c0-.1-.2-.2-.5-.3z"/></svg>';

  /* ---------- Helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const kategoriById = Object.fromEntries(KATEGORI.map((k) => [k.id, k]));
  const mobilById = Object.fromEntries(MOBIL.map((m) => [m.id, m]));
  const produkById = Object.fromEntries(PRODUK.map((p) => [p.id, p]));
  const ikonProduk = (p) => IKON[(kategoriById[p.kategori] || {}).ikon] || IKON.lainnya;
  const namaMobil = (m) => (m ? `${m.merk} ${m.nama}` : "");
  const mobilProduk = (p) => (Array.isArray(p.mobil) ? p.mobil : [p.mobil]).filter(Boolean);
  const fotoProduk = (p) => (Array.isArray(p.foto) ? p.foto : p.foto ? [p.foto] : []).filter(Boolean);
  const waLink = (text) => `https://wa.me/${TOKO.whatsapp}?text=${encodeURIComponent(text)}`;

  function media(p, i = 0) {
    const f = fotoProduk(p)[i];
    return f ? `<img src="${esc(f)}" alt="${esc(p.nama)}" loading="lazy">` : `<span class="ph">${ikonProduk(p)}</span>`;
  }
  function visualMobil(m) {
    return m.foto ? `<img src="${esc(m.foto)}" alt="${esc(namaMobil(m))}" loading="lazy">` : (window.SILUET[m.bentuk] || window.SILUET.mpv);
  }
  const diskon = (p) => (p.hargaCoret > p.harga ? Math.round((1 - p.harga / p.hargaCoret) * 100) : 0);
  function stokLabel(p) {
    if (p.stok <= 0) return '<span class="card__stock out">Stok habis — bisa inden</span>';
    if (p.stok <= 5) return `<span class="card__stock low">Sisa ${p.stok} pcs</span>`;
    return '<span class="card__stock">Stok tersedia</span>';
  }
  function badgeKondisi(p) {
    const bekas = p.kondisi === "Bekas";
    let h = `<span class="cond ${bekas ? "cond--bekas" : "cond--baru"}">${bekas ? "Bekas" : "Baru"}</span>`;
    if (p.kualitas) h += `<span class="cond cond--${esc(String(p.kualitas).toLowerCase())}">${esc(p.kualitas)}</span>`;
    return h;
  }

  /* ---------- Data toko ---------- */
  function isiDataToko() {
    $$("[data-toko]").forEach((el) => {
      el.textContent = TOKO[el.dataset.toko] || "";
      // Sembunyikan baris kontak yang belum diisi (mis. email kosong)
      const li = el.closest(".contact__list li");
      if (li) li.hidden = !TOKO[el.dataset.toko];
    });
    $$("[data-wa]").forEach((el) => { el.href = waLink(el.dataset.wa); el.target = "_blank"; el.rel = "noopener"; });
    const link = (sel, url) => { const el = $(sel); const ada = /^https?:\/\/.+\/.+/.test(url || ""); el.hidden = !ada; if (ada) el.href = url; };
    link("#mapsLink", TOKO.mapsUrl);
    link("#igLink", TOKO.instagram);
    $("#year").textContent = new Date().getFullYear();
    $("#statProduk").textContent = PRODUK.length + (PRODUK.length >= 10 ? "+" : "");
    $("#statProduk").closest("li").hidden = PRODUK.length === 0;
    $("#statMobil").textContent = MOBIL.length;
    const names = MOBIL.map(namaMobil);
    if (names.length) $("#heroCars").textContent = names.length > 1 ? names.slice(0, -1).join(", ") + " dan " + names.slice(-1) : names[0];
    document.title = `${TOKO.nama} — ${TOKO.tagline}`;
  }

  /* ---------- State + URL ---------- */
  const params = new URLSearchParams(location.search);
  const state = {
    mobil: mobilById[params.get("mobil")] ? params.get("mobil") : "semua",
    kategori: params.get("kategori") || "semua",
    kondisi: "semua",
    cari: "",
    urut: "default",
  };
  function syncUrl() {
    const u = new URLSearchParams();
    if (state.mobil !== "semua") u.set("mobil", state.mobil);
    if (state.kategori !== "semua") u.set("kategori", state.kategori);
    const qs = u.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }

  const cocokMobil = (p, id = state.mobil) => id === "semua" || mobilProduk(p).includes(id);

  /* ---------- Pilih mobil (kartu) ---------- */
  function renderMobil() {
    $("#carGrid").innerHTML = MOBIL.map((m) => {
      const n = PRODUK.filter((p) => cocokMobil(p, m.id)).length;
      return `<a href="#produk" class="car${state.mobil === m.id ? " is-active" : ""}" data-mobil="${esc(m.id)}">
        <span class="car__visual">${visualMobil(m)}</span>
        <span class="car__body">
          <span class="car__brand">${esc(m.merk)}</span>
          <span class="car__name">${esc(m.nama)}</span>
          <span class="car__desc">${esc(m.keterangan || "")}</span>
          <span class="car__count">${n ? `${n} produk` : "Produk segera hadir"} <span aria-hidden="true">→</span></span>
        </span>
      </a>`;
    }).join("");
  }

  function renderFilter() {
    $("#carTabs").innerHTML = [{ id: "semua", merk: "", nama: "Semua mobil" }, ...MOBIL]
      .map((m) => `<button class="car-tab${state.mobil === m.id ? " is-active" : ""}" data-mobil="${esc(m.id)}" role="tab">${m.merk ? `<small>${esc(m.merk)}</small>` : ""}${esc(m.nama)}</button>`)
      .join("");

    // Kategori: hanya tampilkan yang punya produk untuk mobil terpilih
    const base = PRODUK.filter((p) => cocokMobil(p));
    const kat = KATEGORI.map((k) => ({ ...k, n: base.filter((p) => p.kategori === k.id).length })).filter((k) => k.n > 0);
    if (state.kategori !== "semua" && !kat.some((k) => k.id === state.kategori)) state.kategori = "semua";
    $("#filterChips").innerHTML =
      `<button class="chip${state.kategori === "semua" ? " is-active" : ""}" data-kat="semua">Semua <span>${base.length}</span></button>` +
      kat.map((k) => `<button class="chip${state.kategori === k.id ? " is-active" : ""}" data-kat="${esc(k.id)}"><i>${IKON[k.ikon] || IKON.lainnya}</i>${esc(k.nama)} <span>${k.n}</span></button>`).join("");

    $$("#kondisiSeg .seg__btn").forEach((b) => b.classList.toggle("is-active", b.dataset.kondisi === state.kondisi));
    const m = mobilById[state.mobil];
    $("#catalogTitle").textContent = m ? `Sparepart ${namaMobil(m)}` : "Semua sparepart";
  }

  function setMobil(id) {
    state.mobil = id;
    state.kategori = "semua";
    renderMobil(); renderFilter(); renderProduk(); syncUrl();
    const a = $(".car-tab.is-active");
    if (a) a.scrollIntoView({ inline: "center", block: "nearest" });
  }
  function setKategori(id) {
    state.kategori = id;
    renderFilter(); renderProduk(); syncUrl();
    const a = $(`#filterChips .chip.is-active`);
    if (a) a.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }

  /* ---------- Produk ---------- */
  function filterProduk() {
    const q = state.cari.trim().toLowerCase();
    const list = PRODUK.filter((p) => {
      if (!cocokMobil(p)) return false;
      if (state.kategori !== "semua" && p.kategori !== state.kategori) return false;
      if (state.kondisi !== "semua" && (p.kondisi || "Baru") !== state.kondisi) return false;
      if (!q) return true;
      const teks = [p.nama, p.kodePart, p.kondisi, p.kualitas, (kategoriById[p.kategori] || {}).nama,
        ...mobilProduk(p).map((id) => namaMobil(mobilById[id])),
        ...(p.spesifikasi || []).map((s) => s.nilai)].join(" ").toLowerCase();
      return q.split(/\s+/).every((w) => teks.includes(w));
    });
    const habis = (p) => (p.stok > 0 ? 0 : 1);
    const sorters = {
      default: (a, b) => habis(a) - habis(b) || (b.unggulan === true) - (a.unggulan === true),
      "harga-asc": (a, b) => a.harga - b.harga,
      "harga-desc": (a, b) => b.harga - a.harga,
      nama: (a, b) => a.nama.localeCompare(b.nama, "id"),
    };
    return list.sort(sorters[state.urut]);
  }

  function kartu(p, i) {
    const d = diskon(p);
    const habis = p.stok <= 0;
    let tagKiri = "<span></span>";
    if (habis) tagKiri = '<span class="tag tag--out">Habis</span>';
    else if (p.unggulan) tagKiri = '<span class="tag tag--hot">Terlaris</span>';
    const nFoto = fotoProduk(p).length;
    const mobilTxt = mobilProduk(p).map((id) => namaMobil(mobilById[id])).filter(Boolean).join(", ");
    return `<article class="card" style="animation-delay:${Math.min(i, 12) * 30}ms">
      <div class="card__media" data-detail="${esc(p.id)}">
        ${media(p)}
        <div class="card__tags">${tagKiri}${d ? `<span class="tag tag--disc">-${d}%</span>` : "<span></span>"}</div>
        ${nFoto > 1 ? `<span class="card__photos">${nFoto} foto</span>` : ""}
      </div>
      <div class="card__body">
        <div class="card__meta">${badgeKondisi(p)}</div>
        <h3 class="card__title" data-detail="${esc(p.id)}">${esc(p.nama)}</h3>
        <p class="card__fit">${esc(mobilTxt)}</p>
        <div class="card__price">
          <span class="price">${rupiah(p.harga)}</span>
          ${d ? `<span class="price-old">${rupiah(p.hargaCoret)}</span>` : ""}
        </div>
        <div class="card__foot">${stokLabel(p)}<span class="card__weight">${window.formatBerat(p.berat)}</span></div>
      </div>
      <div class="card__actions">
        <button class="btn btn--outline btn--detail" data-detail="${esc(p.id)}">Detail</button>
        ${habis
          ? `<a class="btn btn--primary" href="${waLink(`Halo, apakah ${p.nama}${p.kodePart ? ` (${p.kodePart})` : ""} bisa inden?`)}" target="_blank" rel="noopener">Tanya Inden</a>`
          : `<button class="btn btn--primary" data-add="${esc(p.id)}">${ikonCart}<span>Keranjang</span></button>`}
      </div>
    </article>`;
  }

  function renderProduk() {
    const list = filterProduk();
    $("#productGrid").innerHTML = list.map(kartu).join("");
    $("#emptyState").hidden = list.length > 0;
    const kosong = PRODUK.length === 0;
    $("#emptyTitle").textContent = kosong ? "Katalog sedang diperbarui" : "Part tidak ditemukan";
    $("#emptyText").textContent = kosong
      ? "Produk sedang kami tambahkan. Tanyakan stok part yang Anda cari langsung lewat WhatsApp."
      : "Belum ada di katalog? Kami bisa bantu carikan.";
    $("#resultInfo").textContent = `Menampilkan ${list.length} produk`;
  }

  /* ---------- Modal detail ---------- */
  let lastFocus = null;
  function bukaDetail(id) {
    const p = produkById[id];
    if (!p) return;
    const d = diskon(p);
    const habis = p.stok <= 0;
    const foto = fotoProduk(p);
    const mobilTxt = mobilProduk(p).map((mid) => namaMobil(mobilById[mid])).filter(Boolean).join(", ") || "-";
    const spek = [
      ["Cocok untuk", mobilTxt],
      ["Kondisi", p.kondisi || "Baru"],
      p.kualitas ? ["Kualitas", p.kualitas] : null,
      p.kodePart ? ["Nomor part", p.kodePart] : null,
      ["Berat", window.formatBerat(p.berat)],
      ...(p.spesifikasi || []).filter((s) => s.label && s.nilai).map((s) => [s.label, s.nilai]),
      ["Kode produk", p.id],
    ].filter(Boolean);
    $("#modalContent").innerHTML = `<div class="pd">
      <div class="pd__gallery">
        <div class="pd__media" id="pdMain">${media(p)}</div>
        ${foto.length > 1 ? `<div class="pd__thumbs">${foto.map((f, i) => `<button class="pd__thumb${i === 0 ? " is-active" : ""}" data-foto="${i}" aria-label="Foto ${i + 1}"><img src="${esc(f)}" alt=""></button>`).join("")}</div>` : ""}
      </div>
      <div class="pd__info">
        <div class="card__meta">${badgeKondisi(p)}<span>${esc((kategoriById[p.kategori] || {}).nama || "")}</span></div>
        <h2 id="modalTitle">${esc(p.nama)}</h2>
        <div class="pd__price"><span class="price">${rupiah(p.harga)}</span>${d ? `<span class="price-old">${rupiah(p.hargaCoret)}</span><span class="tag tag--disc">-${d}%</span>` : ""}</div>
        ${stokLabel(p)}
        ${p.deskripsi ? `<p class="pd__desc">${esc(p.deskripsi).replace(/\n/g, "<br>")}</p>` : ""}
        <table class="spec"><tbody>${spek.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join("")}</tbody></table>
        <div class="pd__actions">
          ${habis ? "" : `<button class="btn btn--primary btn--block" data-add="${esc(p.id)}">${ikonCart}Tambah ke Keranjang</button>`}
          <a class="btn btn--wa btn--block" target="_blank" rel="noopener" href="${waLink(`Halo, saya tertarik dengan:\n*${p.nama}* (${p.kondisi || "Baru"})\nKode: ${p.id}${p.kodePart ? `\nNo. part: ${p.kodePart}` : ""}\nHarga: ${rupiah(p.harga)}\n\nApakah cocok untuk mobil saya?`)}">${ikonWA}Tanya Kecocokan</a>
        </div>
      </div>
    </div>`;
    $("#modalContent").dataset.id = id;
    lastFocus = document.activeElement;
    $("#productModal").hidden = false;
    document.body.classList.add("no-scroll");
    $("#modalClose").focus();
  }
  function gantiFoto(i) {
    const p = produkById[$("#modalContent").dataset.id];
    $("#pdMain").innerHTML = media(p, i);
    $$(".pd__thumb").forEach((t) => t.classList.toggle("is-active", Number(t.dataset.foto) === i));
  }
  function tutupDetail() {
    $("#productModal").hidden = true;
    if (!$("#cartDrawer").classList.contains("is-open")) document.body.classList.remove("no-scroll");
    if (lastFocus) lastFocus.focus();
  }

  /* ---------- Keranjang ---------- */
  const CART_KEY = "sparepart_cart";
  let cart = {};
  try { cart = JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { cart = {}; }
  Object.keys(cart).forEach((id) => { if (!produkById[id] || produkById[id].stok <= 0) delete cart[id]; });

  function simpanCart() { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* abaikan */ } }
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
  function hitung() {
    const ids = Object.keys(cart);
    return {
      ids,
      qty: ids.reduce((s, id) => s + cart[id], 0),
      total: ids.reduce((s, id) => s + cart[id] * produkById[id].harga, 0),
      berat: ids.reduce((s, id) => s + cart[id] * (Number(produkById[id].berat) || 0), 0),
    };
  }

  function renderCart() {
    const { ids, qty, total, berat } = hitung();
    const badge = $("#cartCount");
    badge.textContent = qty;
    badge.classList.toggle("show", qty > 0);
    if (!ids.length) {
      $("#cartItems").innerHTML = `<div class="cart-empty">${ikonCart}<p><strong>Keranjang masih kosong</strong><br>Yuk pilih sparepart untuk mobil Anda.</p><a href="#produk" class="btn btn--outline btn--sm" data-close-cart>Lihat Produk</a></div>`;
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
          <span class="cart-item__price">${rupiah(p.harga)} · ${p.kondisi || "Baru"}</span>
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
    $("#cartWeight").textContent = window.formatBerat(berat);
  }

  function checkout() {
    const { ids, total, berat } = hitung();
    if (!ids.length) return;
    const baris = ids.map((id, i) => {
      const p = produkById[id];
      return `${i + 1}. ${p.nama} (${p.kondisi || "Baru"})\n   Kode: ${p.id}${p.kodePart ? ` | No. part: ${p.kodePart}` : ""}\n   ${cart[id]} x ${rupiah(p.harga)} = ${rupiah(p.harga * cart[id])}`;
    });
    const pesan = `Halo ${TOKO.nama}, saya ingin memesan:\n\n${baris.join("\n\n")}\n\n*Subtotal: ${rupiah(total)}*\nPerkiraan berat: ${window.formatBerat(berat)}\n\nNama:\nAlamat kirim:\nMobil & tahun:\n\nMohon info total dengan ongkir. Terima kasih.`;
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

  let toastTimer;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
  }
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
      const foto = t.closest("[data-foto]");
      if (foto) { gantiFoto(Number(foto.dataset.foto)); return; }
      const det = t.closest("[data-detail]");
      if (det) { bukaDetail(det.dataset.detail); return; }
      const mob = t.closest("[data-mobil]");
      if (mob) { setMobil(mob.dataset.mobil); if (mob.classList.contains("car-tab")) e.preventDefault(); return; }
      const kat = t.closest("[data-kat]");
      if (kat) { setKategori(kat.dataset.kat); return; }
      const kon = t.closest("[data-kondisi]");
      if (kon) { state.kondisi = kon.dataset.kondisi; renderFilter(); renderProduk(); return; }
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
  renderMobil();
  renderFilter();
  renderProduk();
  renderCart();
  bindEvents();
  if (params.get("produk")) bukaDetail(params.get("produk"));
})();
