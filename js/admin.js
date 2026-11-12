/* =========================================================================
   Panel Admin — mengelola data/data.js tanpa menyentuh kode
   Publikasi: commit langsung ke GitHub (Vercel otomatis update)
   ========================================================================= */
(function () {
  "use strict";

  const DATA_PATH = "data/data.js";
  const CONN_KEY = "admin_koneksi";
  const HEADER = `/* =========================================================================
   DATA TOKO, MOBIL, KATEGORI & PRODUK
   Cara termudah mengubah isi file ini: buka halaman /admin.html di website.
   Jika ingin mengedit manual, ubah nilai di bawah tanpa merusak tanda kutip
   dan koma (format JSON).
   ========================================================================= */
`;

  /* ---------- State ---------- */
  const S = {
    data: null,
    sha: null,          // sha data.js saat dimuat dari GitHub
    dirty: false,
    pending: {},        // path -> dataURL (foto baru yang belum dipublikasikan)
    preview: {},        // path -> dataURL (agar foto baru tetap tampil setelah publikasi)
    conn: null,
    editing: null,      // salinan produk yang sedang diedit
    editingIndex: -1,
  };
  try { S.conn = JSON.parse(localStorage.getItem(CONN_KEY)); } catch (e) { S.conn = null; }
  const PW_KEY = "admin_pw";
  S.server = false;   // true jika /api/admin aktif di Vercel
  S.pw = null;        // password admin (mode login)
  const terhubung = () => !!(S.pw || S.conn);

  /* ---------- Helpers ---------- */
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const slug = (s) => String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "item";
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const imgSrc = (path) => S.pending[path] || S.preview[path] || path;
  const num = (v) => { const n = Number(String(v).replace(/[^\d]/g, "")); return isNaN(n) ? 0 : n; };
  const IKON = window.IKON;
  const ikonKat = (id) => { const k = S.data.kategori.find((x) => x.id === id); return IKON[(k || {}).ikon] || IKON.lainnya; };
  const namaMobil = (m) => (m ? `${m.merk} ${m.nama}`.trim() : "");

  function toast(msg, err) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.toggle("toast--err", !!err);
    t.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(() => t.classList.remove("show"), err ? 5000 : 2400);
  }
  function loading(text) {
    $("#loading").hidden = !text;
    if (text) $("#loadingText").textContent = text;
  }
  function setDirty(v = true) {
    S.dirty = v;
    const nPhotos = Object.keys(S.pending).length;
    $("#publishBtn").disabled = !v;
    $("#publishBtn").textContent = v ? `Publikasikan${nPhotos ? ` (+${nPhotos} foto)` : ""}` : "Tersimpan ✓";
    $("#dirtyNotice").hidden = !v;
  }

  /* ---------- Encode / decode ---------- */
  function b64ToText(b64) {
    const bin = atob(b64.replace(/\n/g, ""));
    return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
  }
  function parseDataJs(text) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start < 0 || end < 0) throw new Error("Format data.js tidak dikenali");
    return JSON.parse(text.slice(start, end + 1));
  }
  function buildDataJs() {
    return HEADER + "window.TOKO_DATA = " + JSON.stringify(S.data, null, 2) + ";\n";
  }
  function normalisasi(d) {
    d.toko = d.toko || {};
    d.mobil = d.mobil || [];
    d.kategori = d.kategori || [];
    d.produk = (d.produk || []).map((p) => ({
      id: p.id, nama: p.nama || "",
      mobil: Array.isArray(p.mobil) ? p.mobil : p.mobil ? [p.mobil] : [],
      kategori: p.kategori || "", harga: Number(p.harga) || 0, hargaCoret: Number(p.hargaCoret) || 0,
      stok: Number(p.stok) || 0, berat: Number(p.berat) || 0, kondisi: p.kondisi === "Bekas" ? "Bekas" : "Baru",
      kualitas: p.kualitas || "", kodePart: p.kodePart || "",
      foto: Array.isArray(p.foto) ? p.foto : p.foto ? [p.foto] : [],
      deskripsi: p.deskripsi || "", spesifikasi: Array.isArray(p.spesifikasi) ? p.spesifikasi : [],
      unggulan: !!p.unggulan, aktif: p.aktif !== false,
    }));
    return d;
  }

  /* ---------- GitHub API ---------- */
  async function gh(path, opts = {}) {
    const res = await fetch(`https://api.github.com/repos/${S.conn.repo}${path}`, {
      ...opts,
      headers: {
        Authorization: `Bearer ${S.conn.token}`,
        Accept: "application/vnd.github+json",
        ...(opts.body ? { "Content-Type": "application/json" } : {}),
      },
      cache: "no-store",
    });
    if (!res.ok) {
      let msg = `${res.status}`;
      try { msg += " " + (await res.json()).message; } catch (e) { /* abaikan */ }
      if (res.status === 401) msg = "Token tidak valid atau sudah kedaluwarsa.";
      if (res.status === 403) msg = "Token tidak punya izin. Pastikan izin Contents = Read and write.";
      if (res.status === 404) msg = "Repository, branch, atau file tidak ditemukan. Periksa nama repo & branch.";
      throw new Error(msg);
    }
    return res.status === 204 ? null : res.json();
  }
  async function ambilDariGitHub() {
    const f = await gh(`/contents/${DATA_PATH}?ref=${encodeURIComponent(S.conn.branch)}`);
    return { data: normalisasi(parseDataJs(b64ToText(f.content))), sha: f.sha };
  }

  async function publikasiGitHub() {
    // Cek apakah data di GitHub berubah sejak dimuat (mis. diedit dari perangkat lain)
    const remote = await gh(`/contents/${DATA_PATH}?ref=${encodeURIComponent(S.conn.branch)}`).catch(() => null);
    if (remote && S.sha && remote.sha !== S.sha) {
      if (!confirm("Data di website sudah diubah dari perangkat/orang lain sejak halaman ini dibuka.\n\nTetap timpa dengan versi Anda?")) return false;
    }
    const ref = await gh(`/git/ref/heads/${encodeURIComponent(S.conn.branch)}`);
    const base = await gh(`/git/commits/${ref.object.sha}`);
    const tree = [];
    const dipakai = new Set(fotoDipakai());
    const fotoBaru = Object.keys(S.pending).filter((p) => dipakai.has(p));
    let i = 0;
    for (const path of fotoBaru) {
      loading(`Mengunggah foto ${++i} dari ${fotoBaru.length}…`);
      const blob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: S.pending[path].split(",")[1], encoding: "base64" }) });
      tree.push({ path, mode: "100644", type: "blob", sha: blob.sha });
    }
    loading("Menyimpan data…");
    const dataBlob = await gh("/git/blobs", { method: "POST", body: JSON.stringify({ content: buildDataJs(), encoding: "utf-8" }) });
    tree.push({ path: DATA_PATH, mode: "100644", type: "blob", sha: dataBlob.sha });
    const newTree = await gh("/git/trees", { method: "POST", body: JSON.stringify({ base_tree: base.tree.sha, tree }) });
    const commit = await gh("/git/commits", {
      method: "POST",
      body: JSON.stringify({ message: `Update data toko via panel admin (${S.data.produk.length} produk)`, tree: newTree.sha, parents: [ref.object.sha] }),
    });
    await gh(`/git/refs/heads/${encodeURIComponent(S.conn.branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
    S.sha = dataBlob.sha;
    Object.assign(S.preview, S.pending);
    S.pending = {};
    return true;
  }

  /* ---------- Mode login password (via /api/admin di Vercel) ---------- */
  async function api(action, extra = {}) {
    const res = await fetch("api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: S.pw, action, ...extra }),
      cache: "no-store",
    });
    let j = {};
    try { j = await res.json(); } catch (e) { /* abaikan */ }
    if (!res.ok) { const err = new Error(j.error || `HTTP ${res.status}`); err.status = res.status; throw err; }
    return j;
  }
  async function cekServer() {
    if (location.protocol === "file:") return false;
    try {
      const r = await fetch("api/admin", { cache: "no-store" });
      return r.ok && (await r.json()).enabled === true;
    } catch (e) { return false; }
  }
  async function ambilDariServer() {
    const r = await api("load");
    return { data: normalisasi(parseDataJs(r.content)), sha: r.sha };
  }
  async function publikasiServer() {
    const dipakai = new Set(fotoDipakai());
    const fotoBaru = Object.keys(S.pending).filter((p) => dipakai.has(p));
    const files = [];
    let i = 0;
    for (const path of fotoBaru) {
      loading(`Mengunggah foto ${++i} dari ${fotoBaru.length}…`);
      const r = await api("blob", { content: S.pending[path].split(",")[1] });
      files.push({ path, sha: r.sha });
    }
    loading("Menyimpan data…");
    const kirim = (force) => api("commit", { files, dataJs: buildDataJs(), baseSha: S.sha, force, message: `Update data toko via panel admin (${S.data.produk.length} produk)` });
    let r;
    try { r = await kirim(false); }
    catch (e) {
      if (e.status !== 409) throw e;
      loading(false);
      if (!confirm("Data di website sudah diubah dari perangkat/orang lain sejak halaman ini dibuka.\n\nTetap timpa dengan versi Anda?")) return false;
      loading("Menyimpan data…");
      r = await kirim(true);
    }
    S.sha = r.sha;
    Object.assign(S.preview, S.pending);
    S.pending = {};
    return true;
  }

  function tampilLogin(show) {
    $("#login").hidden = !show;
    document.body.classList.toggle("no-scroll", show);
    if (show) setTimeout(() => $("#loginPw").focus(), 50);
  }
  async function login(pw, ingat) {
    S.pw = pw;
    try {
      await api("login");
      const { data, sha } = await ambilDariServer();
      S.data = data; S.sha = sha; S.pending = {};
      try {
        (ingat ? localStorage : sessionStorage).setItem(PW_KEY, pw);
        (ingat ? sessionStorage : localStorage).removeItem(PW_KEY);
      } catch (e) { /* abaikan */ }
      return true;
    } catch (e) {
      S.pw = null;
      throw e;
    }
  }
  function logout() {
    try { localStorage.removeItem(PW_KEY); sessionStorage.removeItem(PW_KEY); } catch (e) { /* abaikan */ }
    S.pw = null;
    renderKoneksi();
    tampilLogin(true);
  }

  function fotoDipakai() {
    return [...S.data.produk.flatMap((p) => p.foto), ...S.data.mobil.map((m) => m.foto).filter(Boolean)];
  }

  /* ---------- Unduh manual ---------- */
  function unduh(nama, href) {
    const a = document.createElement("a");
    a.href = href; a.download = nama;
    document.body.appendChild(a); a.click(); a.remove();
  }
  function unduhSemua() {
    const url = URL.createObjectURL(new Blob([buildDataJs()], { type: "text/javascript" }));
    unduh("data.js", url);
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    const dipakai = new Set(fotoDipakai());
    const foto = Object.keys(S.pending).filter((p) => dipakai.has(p));
    foto.forEach((p, i) => setTimeout(() => unduh(p.split("/").pop(), S.pending[p]), 400 * (i + 1)));
    alert(`Diunduh: data.js${foto.length ? ` + ${foto.length} foto` : ""}.\n\nUpload ke GitHub:\n• data.js → folder data/ (timpa file lama)\n${foto.length ? "• foto produk → folder images/produk/\n• foto mobil → folder images/mobil/\n" : ""}\nSetelah itu Vercel otomatis memperbarui website.`);
  }

  async function publikasikan() {
    if (!S.dirty) return;
    if (!terhubung()) {
      if (S.server) { tampilLogin(true); return; }
      bukaTab("koneksi");
      toast("Belum terhubung. Atur koneksi sekali di halaman ini agar bisa publikasi otomatis.", true);
      return;
    }
    try {
      loading("Memulai publikasi…");
      const ok = S.pw ? await publikasiServer() : await publikasiGitHub();
      loading(false);
      if (ok) { setDirty(false); renderAll(); toast("✓ Terpublikasi! Website diperbarui dalam ±1 menit."); }
    } catch (e) {
      loading(false);
      if (e.status === 401 && S.pw) { toast("Sesi berakhir / password berubah. Silakan masuk lagi.", true); logout(); return; }
      toast("Gagal publikasi: " + e.message, true);
    }
  }

  /* ---------- Kompres foto ---------- */
  function kompres(file, max = 1400, quality = 0.85) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const r = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * r); c.height = Math.round(img.height * r);
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
        ctx.drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("File bukan gambar yang valid")); };
      img.src = url;
    });
  }
  async function tambahFoto(files, folder, baseName) {
    const hasil = [];
    for (const f of files) {
      if (!f.type.startsWith("image/")) continue;
      try {
        const dataUrl = await kompres(f);
        const path = `images/${folder}/${slug(baseName)}-${uid()}.jpg`;
        S.pending[path] = dataUrl;
        hasil.push(path);
      } catch (e) { toast(e.message, true); }
    }
    return hasil;
  }

  /* =======================================================================
     PRODUK — daftar
     ======================================================================= */
  const filt = { q: "", mobil: "semua", kategori: "semua" };

  function renderFilterProduk() {
    $("#fMobil").innerHTML = `<option value="semua">Semua mobil</option>` + S.data.mobil.map((m) => `<option value="${esc(m.id)}">${esc(namaMobil(m))}</option>`).join("");
    $("#fKategori").innerHTML = `<option value="semua">Semua jenis</option>` + S.data.kategori.map((k) => `<option value="${esc(k.id)}">${esc(k.nama)}</option>`).join("");
    $("#fMobil").value = S.data.mobil.some((m) => m.id === filt.mobil) ? filt.mobil : "semua";
    $("#fKategori").value = S.data.kategori.some((k) => k.id === filt.kategori) ? filt.kategori : "semua";
  }

  function renderProduk() {
    const q = filt.q.trim().toLowerCase();
    const list = S.data.produk
      .map((p, i) => ({ p, i }))
      .filter(({ p }) => (filt.mobil === "semua" || p.mobil.includes(filt.mobil)) && (filt.kategori === "semua" || p.kategori === filt.kategori) && (!q || `${p.nama} ${p.kodePart} ${p.id}`.toLowerCase().includes(q)));
    if (!list.length) {
      $("#plist").innerHTML = `<div class="empty">Belum ada produk${q || filt.mobil !== "semua" || filt.kategori !== "semua" ? " yang cocok dengan filter" : ""}.</div>`;
      return;
    }
    $("#plist").innerHTML = list.map(({ p, i }) => {
      const kat = S.data.kategori.find((k) => k.id === p.kategori);
      const mobil = p.mobil.map((id) => namaMobil(S.data.mobil.find((m) => m.id === id))).filter(Boolean).join(", ") || "⚠ belum pilih mobil";
      return `<div class="prow${p.aktif ? "" : " is-hidden"}" data-i="${i}">
        <div class="prow__thumb">${p.foto[0] ? `<img src="${esc(imgSrc(p.foto[0]))}" alt="">` : ikonKat(p.kategori)}</div>
        <div class="prow__info">
          <div class="prow__name">${esc(p.nama || "(tanpa nama)")}</div>
          <div class="prow__meta">
            <span class="pill ${p.kondisi === "Bekas" ? "pill--bekas" : "pill--baru"}">${p.kondisi}</span>
            <span>${esc(kat ? kat.nama : "-")}</span><span>·</span><span>${esc(mobil)}</span>
            <span>·</span><span>${window.formatBerat(p.berat)}</span><span>·</span><span>${p.foto.length} foto</span>
          </div>
        </div>
        <div class="prow__fields">
          <label><span class="mini-label">Harga (Rp)</span><input class="input" inputmode="numeric" data-f="harga" value="${p.harga.toLocaleString("id-ID")}"></label>
          <label><span class="mini-label">Stok</span>
            <div class="stepper"><button type="button" data-step="-1" aria-label="Kurangi stok">−</button><input inputmode="numeric" data-f="stok" value="${p.stok}"><button type="button" data-step="1" aria-label="Tambah stok">+</button></div>
          </label>
          <label class="switch" title="Tampilkan di website"><input type="checkbox" data-f="aktif" ${p.aktif ? "checked" : ""}><span class="mini-label" style="margin:0">Tampil</span></label>
        </div>
        <div class="prow__actions">
          <button class="btn btn--outline btn--sm" data-act="edit">Edit</button>
          <button class="icon-btn" data-act="dup" title="Duplikat">⧉</button>
        </div>
      </div>`;
    }).join("");
  }

  function bindProdukList() {
    $("#plist").addEventListener("change", (e) => {
      const row = e.target.closest(".prow");
      if (!row) return;
      const p = S.data.produk[row.dataset.i];
      const f = e.target.dataset.f;
      if (f === "harga") { p.harga = num(e.target.value); e.target.value = p.harga.toLocaleString("id-ID"); }
      if (f === "stok") { p.stok = num(e.target.value); e.target.value = p.stok; }
      if (f === "aktif") { p.aktif = e.target.checked; row.classList.toggle("is-hidden", !p.aktif); }
      setDirty();
    });
    $("#plist").addEventListener("click", (e) => {
      const row = e.target.closest(".prow");
      if (!row) return;
      const i = Number(row.dataset.i);
      const step = e.target.closest("[data-step]");
      if (step) {
        const p = S.data.produk[i];
        p.stok = Math.max(0, p.stok + Number(step.dataset.step));
        $('[data-f="stok"]', row).value = p.stok;
        setDirty();
        return;
      }
      const act = e.target.closest("[data-act]");
      if (!act) return;
      if (act.dataset.act === "edit") bukaEditor(i);
      if (act.dataset.act === "dup") {
        const c = clone(S.data.produk[i]);
        c.id = idBaru(); c.nama += " (salinan)";
        S.data.produk.splice(i + 1, 0, c);
        setDirty(); renderProduk();
        bukaEditor(i + 1);
      }
    });
  }

  function idBaru() {
    const max = S.data.produk.reduce((m, p) => Math.max(m, Number(String(p.id).replace(/\D/g, "")) || 0), 0);
    return "P-" + String(max + 1).padStart(4, "0");
  }

  /* =======================================================================
     PRODUK — editor
     ======================================================================= */
  const PRESET_SPEK = ["Kecocokan tahun", "Posisi", "Isi", "Material", "Merek", "Garansi", "Kondisi fisik", "Ukuran"];

  function bukaEditor(i) {
    S.editingIndex = i;
    S.editing = i >= 0 ? clone(S.data.produk[i]) : {
      id: idBaru(), nama: "", mobil: filt.mobil !== "semua" ? [filt.mobil] : [], kategori: filt.kategori !== "semua" ? filt.kategori : "",
      harga: 0, hargaCoret: 0, stok: 1, berat: 0, kondisi: "Baru", kualitas: "", kodePart: "", foto: [],
      deskripsi: "", spesifikasi: [], unggulan: false, aktif: true,
    };
    $("#editorTitle").textContent = i >= 0 ? "Edit Produk" : "Tambah Produk";
    $("#deleteProduk").hidden = i < 0;
    renderEditor();
    S.editorTouched = false;
    $("#editor").hidden = false;
    document.body.classList.add("no-scroll");
    $("#editorForm").scrollTop = 0;
  }
  function tutupEditor(force) {
    if (!force && S.editorTouched && !confirm("Perubahan pada produk ini belum disimpan. Tutup tanpa menyimpan?")) return;
    $("#editor").hidden = true;
    document.body.classList.remove("no-scroll");
    S.editing = null;
  }

  function renderEditor() {
    const p = S.editing;
    const fmt = (n) => (n ? Number(n).toLocaleString("id-ID") : "");
    $("#editorForm").innerHTML = `
      <label class="field"><span>Nama produk <em>*</em></span>
        <input class="input" name="nama" value="${esc(p.nama)}" placeholder="Contoh: Kampas Rem Depan" required></label>

      <div class="field"><span>Cocok untuk mobil <em>*</em> <small>(boleh lebih dari satu)</small></span>
        <div class="choice" id="cMobil">${S.data.mobil.map((m) => `<label><input type="checkbox" name="mobil" value="${esc(m.id)}" ${p.mobil.includes(m.id) ? "checked" : ""}><span>${esc(namaMobil(m))}</span></label>`).join("")}</div></div>

      <div class="field"><span>Jenis produk <em>*</em></span>
        <div class="choice" id="cKategori">${S.data.kategori.map((k) => `<label><input type="radio" name="kategori" value="${esc(k.id)}" ${p.kategori === k.id ? "checked" : ""}><span>${esc(k.nama)}</span></label>`).join("")}</div></div>

      <div class="form__row">
        <div class="field"><span>Kondisi barang <em>*</em></span>
          <div class="choice"><label><input type="radio" name="kondisi" value="Baru" ${p.kondisi !== "Bekas" ? "checked" : ""}><span>Baru</span></label><label><input type="radio" name="kondisi" value="Bekas" ${p.kondisi === "Bekas" ? "checked" : ""}><span>Bekas</span></label></div></div>
        <label class="field"><span>Kualitas</span>
          <select class="input" name="kualitas">${["", "Original", "OEM", "Aftermarket"].map((v) => `<option value="${v}" ${p.kualitas === v ? "selected" : ""}>${v || "— Tidak disebut —"}</option>`).join("")}</select></label>
      </div>

      <div class="form__section"><h3>Harga, stok & berat</h3>
        <div class="form__row">
          <label class="field"><span>Harga jual <em>*</em></span><div class="input-affix"><b>Rp</b><input class="input" name="harga" inputmode="numeric" value="${fmt(p.harga)}" placeholder="0"></div></label>
          <label class="field"><span>Harga coret (sebelum diskon)</span><div class="input-affix"><b>Rp</b><input class="input" name="hargaCoret" inputmode="numeric" value="${fmt(p.hargaCoret)}" placeholder="kosongkan jika tidak diskon"></div></label>
        </div>
        <div class="form__row" style="margin-top:12px">
          <label class="field"><span>Stok <em>*</em></span><input class="input" name="stok" inputmode="numeric" value="${p.stok}"><small>0 = habis (tombol berubah jadi "Tanya Inden")</small></label>
          <label class="field"><span>Berat <em>*</em></span><div class="input-affix"><input class="input pr" name="berat" inputmode="numeric" value="${p.berat || ""}" placeholder="0"><b class="r">gram</b></div><small id="beratInfo">${p.berat ? "= " + window.formatBerat(p.berat) : "1 kg = 1000 gram. Dipakai untuk perkiraan ongkir."}</small></label>
        </div>
      </div>

      <div class="form__section"><h3>Foto produk</h3>
        <p class="hint">Foto pertama menjadi foto utama. Foto otomatis dikecilkan agar website tetap cepat.</p>
        <div class="photos" id="photos"></div>
      </div>

      <div class="form__section"><h3>Deskripsi & spesifikasi</h3>
        <label class="field"><span>Nomor part</span><input class="input" name="kodePart" value="${esc(p.kodePart)}" placeholder="opsional, mis. 58101-A9A70"></label>
        <label class="field" style="margin-top:12px"><span>Deskripsi</span><textarea class="input" name="deskripsi" placeholder="Jelaskan produk, kondisi, isi paket, dll.">${esc(p.deskripsi)}</textarea></label>
        <div class="field" style="margin-top:12px"><span>Spesifikasi</span>
          <div class="specs" id="specs"></div>
          <div class="presets"><button type="button" data-spec="">+ Baris kosong</button>${PRESET_SPEK.map((s) => `<button type="button" data-spec="${esc(s)}">+ ${esc(s)}</button>`).join("")}</div>
        </div>
      </div>

      <div class="form__section form__row">
        <label class="switch"><input type="checkbox" name="unggulan" ${p.unggulan ? "checked" : ""}> Tandai "Terlaris"</label>
        <label class="switch"><input type="checkbox" name="aktif" ${p.aktif ? "checked" : ""}> Tampilkan di website</label>
      </div>`;
    renderFoto();
    renderSpek();
  }

  function renderFoto() {
    const f = S.editing.foto;
    $("#photos").innerHTML = f.map((path, i) => `<div class="photo">
        <img src="${esc(imgSrc(path))}" alt="">
        ${i === 0 ? '<span class="photo__main">Utama</span>' : ""}
        <div class="photo__tools">
          <button type="button" data-ph="left" data-i="${i}" ${i === 0 ? "disabled" : ""} title="Geser ke kiri">←</button>
          <button type="button" data-ph="del" data-i="${i}" title="Hapus foto">🗑</button>
          <button type="button" data-ph="right" data-i="${i}" ${i === f.length - 1 ? "disabled" : ""} title="Geser ke kanan">→</button>
        </div>
      </div>`).join("") +
      `<label class="drop" id="drop"><b>+</b>Tambah foto<small>klik atau seret ke sini</small><input type="file" accept="image/*" multiple id="fotoInput"></label>`;
  }
  function renderSpek() {
    $("#specs").innerHTML = S.editing.spesifikasi.map((s, i) => `<div class="spec-row">
        <input class="input" data-spec-l="${i}" value="${esc(s.label)}" placeholder="Nama, mis. Posisi">
        <input class="input" data-spec-v="${i}" value="${esc(s.nilai)}" placeholder="Isi, mis. Depan kiri">
        <button type="button" class="icon-btn" data-spec-del="${i}" title="Hapus baris">✕</button>
      </div>`).join("") || '<p class="hint" style="margin:0">Belum ada spesifikasi.</p>';
  }

  function bacaEditor(validate = true) {
    const form = $("#editorForm");
    const p = S.editing;
    if (!form.elements.nama) return p;
    const fd = new FormData(form);
    const out = {
      ...p,
      nama: fd.get("nama").trim(),
      mobil: fd.getAll("mobil"),
      kategori: fd.get("kategori") || "",
      kondisi: fd.get("kondisi") || "Baru",
      kualitas: fd.get("kualitas") || "",
      harga: num(fd.get("harga")), hargaCoret: num(fd.get("hargaCoret")),
      stok: num(fd.get("stok")), berat: num(fd.get("berat")),
      kodePart: fd.get("kodePart").trim(),
      deskripsi: fd.get("deskripsi").trim(),
      spesifikasi: p.spesifikasi.map((s) => ({ label: s.label.trim(), nilai: s.nilai.trim() })).filter((s) => s.label || s.nilai),
      unggulan: !!fd.get("unggulan"), aktif: !!fd.get("aktif"),
    };
    if (validate) {
      $$(".is-invalid", form).forEach((el) => el.classList.remove("is-invalid"));
      const err = [];
      if (!out.nama) { err.push("nama produk"); form.elements.nama.classList.add("is-invalid"); }
      if (!out.mobil.length) { err.push("mobil"); $("#cMobil").classList.add("is-invalid"); }
      if (!out.kategori) { err.push("jenis produk"); $("#cKategori").classList.add("is-invalid"); }
      if (!out.harga) { err.push("harga"); form.elements.harga.classList.add("is-invalid"); }
      if (!out.berat) { err.push("berat"); form.elements.berat.classList.add("is-invalid"); }
      if (err.length) { toast("Lengkapi: " + err.join(", "), true); const f = $(".is-invalid", form); if (f) f.scrollIntoView({ block: "center", behavior: "smooth" }); return null; }
    }
    return out;
  }

  function bindEditor() {
    const form = $("#editorForm");
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const p = bacaEditor(true);
      if (!p) return;
      if (S.editingIndex >= 0) S.data.produk[S.editingIndex] = p;
      else S.data.produk.unshift(p);
      setDirty();
      tutupEditor(true);
      renderProduk();
      toast("✓ Produk disimpan. Jangan lupa klik Publikasikan.");
    });
    ["input", "change"].forEach((ev) => form.addEventListener(ev, () => { S.editorTouched = true; }));
    form.addEventListener("click", (e) => { if (e.target.closest("button")) S.editorTouched = true; });
    form.addEventListener("input", (e) => {
      const t = e.target;
      if (t.dataset.specL !== undefined) S.editing.spesifikasi[t.dataset.specL].label = t.value;
      if (t.dataset.specV !== undefined) S.editing.spesifikasi[t.dataset.specV].nilai = t.value;
      if (t.name === "berat") $("#beratInfo").textContent = num(t.value) ? "= " + window.formatBerat(num(t.value)) : "1 kg = 1000 gram.";
      if (t.classList.contains("is-invalid")) t.classList.remove("is-invalid");
      const ch = t.closest(".choice"); if (ch) ch.classList.remove("is-invalid");
    });
    form.addEventListener("focusout", (e) => {
      const t = e.target;
      if (["harga", "hargaCoret"].includes(t.name) && t.value) t.value = num(t.value).toLocaleString("id-ID");
    });
    form.addEventListener("click", (e) => {
      const t = e.target.closest("button");
      if (!t) return;
      if (t.dataset.spec !== undefined) {
        S.editing.spesifikasi.push({ label: t.dataset.spec, nilai: "" });
        renderSpek();
        const ins = $$("[data-spec-v]"); (t.dataset.spec ? ins[ins.length - 1] : $$("[data-spec-l]").pop()).focus();
      }
      if (t.dataset.specDel !== undefined) { S.editing.spesifikasi.splice(Number(t.dataset.specDel), 1); renderSpek(); }
      if (t.dataset.ph) {
        const i = Number(t.dataset.i), f = S.editing.foto;
        if (t.dataset.ph === "del") f.splice(i, 1);
        if (t.dataset.ph === "left") [f[i - 1], f[i]] = [f[i], f[i - 1]];
        if (t.dataset.ph === "right") [f[i + 1], f[i]] = [f[i], f[i + 1]];
        renderFoto();
      }
    });
    const onFiles = async (files) => {
      if (!files.length) return;
      loading("Memproses foto…");
      const nama = $("#editorForm").elements.nama.value || "produk";
      S.editing.foto.push(...(await tambahFoto(files, "produk", nama)));
      loading(false);
      renderFoto();
    };
    form.addEventListener("change", (e) => { if (e.target.id === "fotoInput") onFiles([...e.target.files]); });
    form.addEventListener("dragover", (e) => { const d = e.target.closest(".drop"); if (d) { e.preventDefault(); d.classList.add("is-over"); } });
    form.addEventListener("dragleave", (e) => { const d = e.target.closest(".drop"); if (d) d.classList.remove("is-over"); });
    form.addEventListener("drop", (e) => { const d = e.target.closest(".drop"); if (d) { e.preventDefault(); d.classList.remove("is-over"); onFiles([...e.dataTransfer.files]); } });

    $$("[data-close-editor]").forEach((b) => b.addEventListener("click", () => tutupEditor()));
    $("#editor").addEventListener("click", (e) => { if (e.target.id === "editor") tutupEditor(); });
    $("#deleteProduk").addEventListener("click", () => {
      if (!confirm(`Hapus produk "${S.editing.nama}"?\n\nTips: jika hanya ingin menyembunyikan sementara, matikan "Tampilkan di website".`)) return;
      S.data.produk.splice(S.editingIndex, 1);
      setDirty(); tutupEditor(true); renderProduk();
      toast("Produk dihapus.");
    });
  }

  /* =======================================================================
     MOBIL & KATEGORI
     ======================================================================= */
  const BENTUK = { mpv: "MPV / Van", compact: "MPV kecil", suv: "SUV", sedan: "Sedan", pickup: "Pick-up" };

  function renderMobil() {
    $("#mobilList").innerHTML = S.data.mobil.map((m, i) => {
      const n = S.data.produk.filter((p) => p.mobil.includes(m.id)).length;
      return `<div class="row" data-m="${i}">
        <div class="row__top">
          <div class="row__icon row__icon--car">${m.foto ? `<img src="${esc(imgSrc(m.foto))}" alt="">` : window.SILUET[m.bentuk] || window.SILUET.mpv}</div>
          <div class="row__grow"><div class="row__title">${esc(namaMobil(m) || "(mobil baru)")}</div><div class="row__sub">${n} produk</div></div>
          <button class="icon-btn" data-mv="up" ${i === 0 ? "disabled" : ""} title="Naikkan">↑</button>
          <button class="icon-btn" data-mv="down" ${i === S.data.mobil.length - 1 ? "disabled" : ""} title="Turunkan">↓</button>
          <button class="icon-btn" data-mv="del" title="Hapus">🗑</button>
        </div>
        <div class="row__fields">
          <label class="field"><span>Merek</span><input class="input" data-mf="merk" value="${esc(m.merk)}" placeholder="Kia"></label>
          <label class="field"><span>Model</span><input class="input" data-mf="nama" value="${esc(m.nama)}" placeholder="Carnival"></label>
          <label class="field full"><span>Keterangan</span><input class="input" data-mf="keterangan" value="${esc(m.keterangan || "")}" placeholder="Generasi / tahun"></label>
          <label class="field"><span>Bentuk ilustrasi</span><select class="input" data-mf="bentuk">${Object.entries(BENTUK).map(([k, v]) => `<option value="${k}" ${m.bentuk === k ? "selected" : ""}>${v}</option>`).join("")}</select></label>
          <div class="field"><span>Foto mobil (opsional)</span>
            <div class="form__actions"><label class="btn btn--outline btn--sm">${m.foto ? "Ganti" : "Upload"} foto<input type="file" accept="image/*" data-mfoto hidden></label>${m.foto ? '<button class="btn btn--danger-ghost btn--sm" data-mv="nofoto">Hapus foto</button>' : ""}</div></div>
        </div>
      </div>`;
    }).join("") || '<div class="empty">Belum ada mobil.</div>';
  }

  function renderKategori() {
    const opsi = Object.keys(IKON);
    $("#kategoriList").innerHTML = S.data.kategori.map((k, i) => {
      const n = S.data.produk.filter((p) => p.kategori === k.id).length;
      return `<div class="row" data-k="${i}">
        <div class="row__top">
          <div class="row__icon">${IKON[k.ikon] || IKON.lainnya}</div>
          <div class="row__grow"><input class="input" data-kf="nama" value="${esc(k.nama)}" placeholder="Nama jenis produk"><div class="row__sub">${n} produk</div></div>
          <select class="input" data-kf="ikon" style="width:130px" title="Ikon">${opsi.map((o) => `<option value="${o}" ${k.ikon === o ? "selected" : ""}>Ikon: ${o}</option>`).join("")}</select>
          <button class="icon-btn" data-kv="up" ${i === 0 ? "disabled" : ""} title="Naikkan">↑</button>
          <button class="icon-btn" data-kv="down" ${i === S.data.kategori.length - 1 ? "disabled" : ""} title="Turunkan">↓</button>
          <button class="icon-btn" data-kv="del" title="Hapus">🗑</button>
        </div>
      </div>`;
    }).join("") || '<div class="empty">Belum ada jenis produk.</div>';
  }

  function idUnik(base, list) {
    let id = slug(base), n = 2;
    while (list.some((x) => x.id === id)) id = `${slug(base)}-${n++}`;
    return id;
  }
  const geser = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; };

  function bindMobilKategori() {
    $("#addMobil").addEventListener("click", () => {
      S.data.mobil.push({ id: idUnik("mobil-baru-" + uid(), S.data.mobil), merk: "", nama: "", keterangan: "", bentuk: "mpv", foto: "" });
      setDirty(); renderMobil();
      $$("#mobilList .row").pop().querySelector('[data-mf="merk"]').focus();
    });
    $("#addKategori").addEventListener("click", () => {
      S.data.kategori.push({ id: idUnik("jenis-" + uid(), S.data.kategori), nama: "", ikon: "lainnya" });
      setDirty(); renderKategori();
      $$("#kategoriList .row").pop().querySelector('[data-kf="nama"]').focus();
    });

    $("#mobilList").addEventListener("input", (e) => {
      const row = e.target.closest("[data-m]"); const f = e.target.dataset.mf;
      if (!row || !f || f === "bentuk") return;
      const m = S.data.mobil[row.dataset.m];
      m[f] = e.target.value.trim();
      $(".row__title", row).textContent = namaMobil(m) || "(mobil baru)";
      setDirty();
    });
    $("#mobilList").addEventListener("change", async (e) => {
      const row = e.target.closest("[data-m]"); if (!row) return;
      const m = S.data.mobil[row.dataset.m];
      if (e.target.dataset.mf) {
        m[e.target.dataset.mf] = e.target.value.trim();
        // id dibuat dari nama saat pertama diisi (agar tautan tetap rapi)
        if (m.id.startsWith("mobil-baru-") && m.merk && m.nama) m.id = idUnik(`${m.merk}-${m.nama}`, S.data.mobil.filter((x) => x !== m));
        setDirty(); renderFilterProduk();
        if (e.target.dataset.mf === "bentuk") renderMobil();
      }
      if (e.target.dataset.mfoto !== undefined && e.target.files.length) {
        loading("Memproses foto…");
        const [path] = await tambahFoto([e.target.files[0]], "mobil", `${m.merk}-${m.nama}`);
        loading(false);
        if (path) { m.foto = path; setDirty(); renderMobil(); }
      }
    });
    $("#mobilList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-mv]"); if (!b) return;
      const i = Number(b.closest("[data-m]").dataset.m);
      const m = S.data.mobil[i];
      if (b.dataset.mv === "up") geser(S.data.mobil, i, -1);
      if (b.dataset.mv === "down") geser(S.data.mobil, i, 1);
      if (b.dataset.mv === "nofoto") m.foto = "";
      if (b.dataset.mv === "del") {
        const n = S.data.produk.filter((p) => p.mobil.includes(m.id)).length;
        if (!confirm(`Hapus mobil "${namaMobil(m)}"?${n ? `\n\n${n} produk terhubung ke mobil ini. Produk tidak ikut terhapus, tetapi perlu dipilihkan mobil lain.` : ""}`)) return;
        S.data.produk.forEach((p) => { p.mobil = p.mobil.filter((id) => id !== m.id); });
        S.data.mobil.splice(i, 1);
      }
      setDirty(); renderMobil(); renderFilterProduk(); renderProduk();
    });

    $("#kategoriList").addEventListener("input", (e) => {
      const row = e.target.closest("[data-k]"); if (!row || e.target.dataset.kf !== "nama") return;
      S.data.kategori[row.dataset.k].nama = e.target.value.trim();
      setDirty();
    });
    $("#kategoriList").addEventListener("change", (e) => {
      const row = e.target.closest("[data-k]"); if (!row) return;
      const k = S.data.kategori[row.dataset.k];
      const f = e.target.dataset.kf; if (!f) return;
      k[f] = e.target.value.trim();
      if (f === "nama" && k.id.startsWith("jenis-") && k.nama) {
        const baru = idUnik(k.nama, S.data.kategori.filter((x) => x !== k));
        S.data.produk.forEach((p) => { if (p.kategori === k.id) p.kategori = baru; });
        k.id = baru;
      }
      setDirty(); renderFilterProduk();
      if (f === "ikon") renderKategori();
    });
    $("#kategoriList").addEventListener("click", (e) => {
      const b = e.target.closest("[data-kv]"); if (!b) return;
      const i = Number(b.closest("[data-k]").dataset.k);
      const k = S.data.kategori[i];
      if (b.dataset.kv === "up") geser(S.data.kategori, i, -1);
      if (b.dataset.kv === "down") geser(S.data.kategori, i, 1);
      if (b.dataset.kv === "del") {
        const n = S.data.produk.filter((p) => p.kategori === k.id).length;
        if (n) { alert(`Jenis "${k.nama}" masih dipakai ${n} produk. Pindahkan produk tersebut ke jenis lain terlebih dahulu.`); return; }
        if (!confirm(`Hapus jenis produk "${k.nama}"?`)) return;
        S.data.kategori.splice(i, 1);
      }
      setDirty(); renderKategori(); renderFilterProduk();
    });
  }

  /* =======================================================================
     INFO TOKO
     ======================================================================= */
  const FIELD_TOKO = [
    ["nama", "Nama toko", "SparepartMobil"],
    ["tagline", "Slogan singkat", "Sparepart Kia & Chevrolet / Opel"],
    ["whatsapp", "Nomor WhatsApp", "6281234567890", "Format internasional tanpa + dan tanpa 0 di depan. Contoh: 0812-3456-7890 → 6281234567890"],
    ["telepon", "Telepon (ditampilkan)", "0812-3456-7890"],
    ["email", "Email", "halo@tokoanda.id"],
    ["alamat", "Alamat", "Jl. …"],
    ["jamBuka", "Jam buka", "Senin – Sabtu, 08.00 – 17.00 WIB"],
    ["instagram", "Link Instagram", "https://instagram.com/…"],
    ["mapsUrl", "Link Google Maps", "https://maps.app.goo.gl/…"],
  ];
  function renderToko() {
    $("#tokoForm").innerHTML = FIELD_TOKO.map(([k, l, ph, help]) => `<label class="field"><span>${l}</span><input class="input" name="${k}" value="${esc(S.data.toko[k] || "")}" placeholder="${esc(ph)}">${help ? `<small>${help}</small>` : ""}</label>`).join("");
    $("#brandToko").textContent = S.data.toko.nama || "";
  }
  function bindToko() {
    $("#tokoForm").addEventListener("input", (e) => {
      let v = e.target.value;
      if (e.target.name === "whatsapp") {
        v = v.replace(/\D/g, "");
        if (v.startsWith("0")) v = "62" + v.slice(1);
      }
      S.data.toko[e.target.name] = v.trim();
      setDirty();
    });
    $("#tokoForm").addEventListener("change", (e) => { if (e.target.name === "whatsapp") e.target.value = S.data.toko.whatsapp; $("#brandToko").textContent = S.data.toko.nama || ""; });
  }

  /* =======================================================================
     KONEKSI
     ======================================================================= */
  function renderKoneksi() {
    const f = $("#connForm");
    f.repo.value = S.conn ? S.conn.repo : "";
    f.branch.value = S.conn ? S.conn.branch : "";
    f.token.value = S.conn ? S.conn.token : "";
    const st = $("#connStatus");
    st.className = "status " + (terhubung() ? "status--ok" : "status--off");
    st.textContent = S.pw ? "Masuk sebagai admin" : S.conn ? "Terhubung ke GitHub" : "Belum terhubung";
    $("#offlineNotice").hidden = terhubung();
    $("#serverOn").hidden = !S.server;
    $("#serverOff").hidden = S.server;
    $("#logoutBtn").hidden = !S.pw;
    $("#loginBtn").hidden = !S.server || !!S.pw;
    $("#tokenBox").hidden = S.server;
  }
  function bindKoneksi() {
    $("#connForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const conn = {
        repo: f.repo.value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/$/, ""),
        branch: f.branch.value.trim(),
        token: f.token.value.trim(),
      };
      const lama = S.conn;
      S.conn = conn;
      loading("Memeriksa koneksi…");
      try {
        const { data, sha } = await ambilDariGitHub();
        loading(false);
        if (S.dirty && !confirm("Terhubung! Ada perubahan yang belum dipublikasikan.\n\nOK = buang perubahan dan muat data terbaru dari GitHub\nBatal = pertahankan perubahan Anda (lalu klik Publikasikan)")) {
          S.sha = sha;
        } else {
          S.data = data; S.sha = sha; S.pending = {}; setDirty(false);
        }
        localStorage.setItem(CONN_KEY, JSON.stringify(conn));
        renderAll();
        toast("✓ Terhubung ke GitHub");
      } catch (err) {
        loading(false);
        S.conn = lama;
        toast("Gagal terhubung: " + err.message, true);
      }
    });
    $("#disconnectBtn").addEventListener("click", () => {
      if (!confirm("Putuskan koneksi GitHub di browser ini?")) return;
      localStorage.removeItem(CONN_KEY);
      S.conn = null; S.sha = null;
      renderKoneksi();
      toast("Koneksi diputus.");
    });
    $("#downloadBtn").addEventListener("click", unduhSemua);
    $("#logoutBtn").addEventListener("click", () => { if (!S.dirty || confirm("Ada perubahan yang belum dipublikasikan. Tetap keluar?")) { setDirty(false); logout(); } });
    $("#loginBtn").addEventListener("click", () => tampilLogin(true));
    $("#loginSkip").addEventListener("click", () => { tampilLogin(false); renderKoneksi(); });
    $("#loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const pw = $("#loginPw").value;
      if (!pw) return;
      $("#loginErr").hidden = true;
      loading("Masuk…");
      try {
        await login(pw, $("#loginIngat").checked);
        loading(false);
        $("#loginPw").value = "";
        tampilLogin(false);
        renderAll(); setDirty(false);
        toast("✓ Berhasil masuk. Perubahan bisa langsung dipublikasikan.");
      } catch (err) {
        loading(false);
        $("#loginErr").textContent = err.status === 401 ? "Password salah." : "Gagal masuk: " + err.message;
        $("#loginErr").hidden = false;
      }
    });
  }

  /* =======================================================================
     UMUM
     ======================================================================= */
  function bukaTab(id) {
    $$(".tab").forEach((t) => t.classList.toggle("is-active", t.dataset.tab === id));
    $$(".panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + id));
    window.scrollTo(0, 0);
  }
  function renderAll() {
    renderFilterProduk(); renderProduk(); renderMobil(); renderKategori(); renderToko(); renderKoneksi();
  }

  function bindUmum() {
    $("#tabs").addEventListener("click", (e) => { const t = e.target.closest("[data-tab]"); if (t) bukaTab(t.dataset.tab); });
    document.addEventListener("click", (e) => { const g = e.target.closest("[data-goto]"); if (g) { e.preventDefault(); bukaTab(g.dataset.goto); } });
    $("#publishBtn").addEventListener("click", publikasikan);
    $("#addProduk").addEventListener("click", () => bukaEditor(-1));
    $("#qProduk").addEventListener("input", (e) => { filt.q = e.target.value; renderProduk(); });
    $("#fMobil").addEventListener("change", (e) => { filt.mobil = e.target.value; renderProduk(); });
    $("#fKategori").addEventListener("change", (e) => { filt.kategori = e.target.value; renderProduk(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !$("#editor").hidden) tutupEditor(); });
    window.addEventListener("beforeunload", (e) => { if (S.dirty) { e.preventDefault(); e.returnValue = ""; } });
  }

  async function init() {
    bindUmum(); bindProdukList(); bindEditor(); bindMobilKategori(); bindToko(); bindKoneksi();
    S.data = normalisasi(clone(window.TOKO_DATA || {}));
    S.server = await cekServer();
    let pwTersimpan = null;
    try { pwTersimpan = localStorage.getItem(PW_KEY) || sessionStorage.getItem(PW_KEY); } catch (e) { /* abaikan */ }
    if (S.server) {
      if (pwTersimpan) {
        loading("Memuat data terbaru…");
        try { await login(pwTersimpan, !!localStorage.getItem(PW_KEY)); } catch (e) { if (e.status !== 401) toast("Gagal memuat: " + e.message, true); }
        loading(false);
      }
      if (!S.pw) tampilLogin(true);
    } else if (S.conn) {
      loading("Memuat data terbaru dari GitHub…");
      try {
        const { data, sha } = await ambilDariGitHub();
        S.data = data; S.sha = sha;
      } catch (e) {
        toast("Gagal memuat dari GitHub: " + e.message + " — menampilkan data dari website.", true);
      }
      loading(false);
    }
    renderAll();
    setDirty(false);
  }
  init();
})();
