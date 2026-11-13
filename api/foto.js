/* =========================================================================
   Halaman foto produk untuk link di chat WhatsApp
   Alamat: /foto/P-0003  (diarahkan ke /api/foto?id=P-0003 lewat vercel.json)
   - Menampilkan foto produk besar + nama + harga
   - Memberi tag og:image agar WhatsApp menampilkan pratinjau foto
   ========================================================================= */
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const rupiah = (n) => "Rp" + Number(n || 0).toLocaleString("id-ID");

module.exports = async (req, res) => {
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (req.socket && req.socket.encrypted ? "https" : "http");
  const base = `${proto}://${host}`;
  const url = new URL(req.url, base);
  const id = (url.searchParams.get("id") || "").trim();
  const vi = url.searchParams.get("v");

  let data;
  try {
    const r = await fetch(`${base}/data/data.js`, { cache: "no-store" });
    const t = await r.text();
    data = JSON.parse(t.slice(t.indexOf("{"), t.lastIndexOf("}") + 1));
  } catch (e) {
    res.statusCode = 302; res.setHeader("Location", "/"); return res.end();
  }

  const p = (data.produk || []).find((x) => x.id === id);
  if (!p) { res.statusCode = 302; res.setHeader("Location", "/"); return res.end(); }

  const abs = (f) => { try { return new URL(f, base + "/").href; } catch (e) { return ""; } };
  const foto = (Array.isArray(p.foto) ? p.foto : p.foto ? [p.foto] : []).filter(Boolean).map(abs).filter(Boolean);
  const variasi = Array.isArray(p.variasi) ? p.variasi : [];
  const v = vi !== null ? variasi[Number(vi)] : null;
  const harga = v ? v.harga : variasi.length ? Math.min(...variasi.map((x) => Number(x.harga) || 0)) : p.harga;
  const toko = (data.toko && data.toko.nama) || "Toko";
  const judul = p.nama + (v ? ` — ${v.nama}` : "");
  const desk = `${rupiah(harga)} · ${p.kondisi || "Baru"} · ${toko}`;
  const linkProduk = `${base}/?produk=${encodeURIComponent(p.id)}`;

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(judul)} — ${esc(toko)}</title>
<meta name="robots" content="noindex">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(judul)}">
<meta property="og:description" content="${esc(desk)}">
${foto[0] ? `<meta property="og:image" content="${esc(foto[0])}">` : ""}
<meta property="og:url" content="${esc(base + url.pathname + url.search)}">
<meta name="twitter:card" content="summary_large_image">
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: #0f1720; color: #fff; min-height: 100vh; display: flex; flex-direction: column; }
  .foto { flex: 1; display: flex; flex-direction: column; gap: 10px; align-items: center; justify-content: center; padding: 16px; }
  .foto img { max-width: 100%; max-height: 75vh; object-fit: contain; border-radius: 12px; background: #fff; }
  .kosong { color: #8794a1; padding: 40px; text-align: center; }
  .info { background: #fff; color: #0f1720; padding: 16px 16px 20px; border-radius: 18px 18px 0 0; }
  .info h1 { font-size: 18px; margin: 0 0 4px; line-height: 1.3; }
  .info p { margin: 0 0 14px; color: #64707d; font-size: 14px; }
  .info b { color: #0f1720; font-size: 18px; }
  .btn { display: block; text-align: center; padding: 13px; border-radius: 999px; background: #d93a2f; color: #fff; text-decoration: none; font-weight: 700; }
  @media (min-width: 720px) { .info { max-width: 720px; width: 100%; margin: 0 auto; } }
</style>
</head>
<body>
  <div class="foto">
    ${foto.length ? foto.map((f) => `<img src="${esc(f)}" alt="${esc(p.nama)}" referrerpolicy="no-referrer">`).join("") : `<div class="kosong">Foto belum tersedia</div>`}
  </div>
  <div class="info">
    <h1>${esc(judul)}</h1>
    <p><b>${rupiah(harga)}</b> · ${esc(p.kondisi || "Baru")} · Kode ${esc(p.id)}</p>
    <a class="btn" href="${esc(linkProduk)}">Lihat produk di ${esc(toko)}</a>
  </div>
</body>
</html>`;

  res.statusCode = 200;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
  res.end(html);
};
