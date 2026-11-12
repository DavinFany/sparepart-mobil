/* =========================================================================
   API Panel Admin (Vercel Serverless Function)
   Menyimpan perubahan dari /admin.html langsung ke GitHub, sehingga admin
   cukup login dengan password — tanpa token di setiap perangkat.

   Atur di Vercel → Project → Settings → Environment Variables:
     ADMIN_PASSWORD  : password untuk masuk panel admin
     GITHUB_TOKEN    : token GitHub (Contents: Read and write) untuk repo ini
   Opsional (otomatis terdeteksi dari Vercel jika kosong):
     GITHUB_REPO     : "username/nama-repo"
     GITHUB_BRANCH   : branch website utama
   ========================================================================= */
const crypto = require("crypto");

const DATA_PATH = "data/data.js";
const cfg = () => ({
  password: process.env.ADMIN_PASSWORD || "",
  token: process.env.GITHUB_TOKEN || "",
  repo: process.env.GITHUB_REPO ||
    (process.env.VERCEL_GIT_REPO_OWNER && process.env.VERCEL_GIT_REPO_SLUG
      ? `${process.env.VERCEL_GIT_REPO_OWNER}/${process.env.VERCEL_GIT_REPO_SLUG}` : ""),
  branch: process.env.GITHUB_BRANCH || process.env.VERCEL_GIT_COMMIT_REF || "main",
});

function passwordCocok(input, benar) {
  const a = crypto.createHash("sha256").update(String(input || "")).digest();
  const b = crypto.createHash("sha256").update(String(benar)).digest();
  return crypto.timingSafeEqual(a, b);
}

async function gh(c, path, opts = {}) {
  const res = await fetch(`https://api.github.com/repos/${c.repo}${path}`, {
    ...opts,
    headers: {
      Authorization: `Bearer ${c.token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "toko-admin",
      ...(opts.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  if (!res.ok) {
    let msg = "";
    try { msg = (await res.json()).message; } catch (e) { /* abaikan */ }
    const err = new Error(`GitHub ${res.status}: ${msg}`);
    err.status = res.status;
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

async function ambilData(c) {
  const f = await gh(c, `/contents/${DATA_PATH}?ref=${encodeURIComponent(c.branch)}`);
  return { content: Buffer.from(f.content, "base64").toString("utf8"), sha: f.sha };
}

module.exports = async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  const c = cfg();
  const siap = !!(c.password && c.token && c.repo);

  if (req.method === "GET") return res.status(200).json({ enabled: siap });
  if (req.method !== "POST") return res.status(405).json({ error: "Metode tidak didukung" });
  if (!siap) return res.status(503).json({ error: "Server admin belum diatur (ADMIN_PASSWORD / GITHUB_TOKEN)." });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch (e) { body = {}; } }
  body = body || {};

  if (!passwordCocok(body.password, c.password)) {
    await new Promise((r) => setTimeout(r, 800)); // perlambat tebakan password
    return res.status(401).json({ error: "Password salah." });
  }

  try {
    switch (body.action) {
      case "login":
        return res.status(200).json({ ok: true, repo: c.repo, branch: c.branch });

      case "load":
        return res.status(200).json(await ambilData(c));

      case "blob": {
        // Satu foto per permintaan (batas ukuran request Vercel ±4,5 MB)
        if (typeof body.content !== "string" || !body.content) return res.status(400).json({ error: "Foto kosong" });
        const blob = await gh(c, "/git/blobs", { method: "POST", body: JSON.stringify({ content: body.content, encoding: "base64" }) });
        return res.status(200).json({ sha: blob.sha });
      }

      case "commit": {
        const files = Array.isArray(body.files) ? body.files : [];
        if (typeof body.dataJs !== "string" || !body.dataJs.includes("window.TOKO_DATA")) return res.status(400).json({ error: "Data tidak valid" });
        if (files.some((f) => !/^images\/[a-z0-9/_.-]+$/i.test(f.path) || !/^[0-9a-f]{40}$/.test(f.sha))) return res.status(400).json({ error: "Daftar foto tidak valid" });

        if (!body.force && body.baseSha) {
          const now = await gh(c, `/contents/${DATA_PATH}?ref=${encodeURIComponent(c.branch)}`).catch(() => null);
          if (now && now.sha !== body.baseSha) return res.status(409).json({ error: "conflict" });
        }
        const ref = await gh(c, `/git/ref/heads/${encodeURIComponent(c.branch)}`);
        const base = await gh(c, `/git/commits/${ref.object.sha}`);
        const dataBlob = await gh(c, "/git/blobs", { method: "POST", body: JSON.stringify({ content: body.dataJs, encoding: "utf-8" }) });
        const tree = await gh(c, "/git/trees", {
          method: "POST",
          body: JSON.stringify({
            base_tree: base.tree.sha,
            tree: [...files.map((f) => ({ path: f.path, mode: "100644", type: "blob", sha: f.sha })),
              { path: DATA_PATH, mode: "100644", type: "blob", sha: dataBlob.sha }],
          }),
        });
        const commit = await gh(c, "/git/commits", {
          method: "POST",
          body: JSON.stringify({ message: String(body.message || "Update data toko via panel admin").slice(0, 200), tree: tree.sha, parents: [ref.object.sha] }),
        });
        await gh(c, `/git/refs/heads/${encodeURIComponent(c.branch)}`, { method: "PATCH", body: JSON.stringify({ sha: commit.sha }) });
        return res.status(200).json({ sha: dataBlob.sha });
      }

      default:
        return res.status(400).json({ error: "Aksi tidak dikenal" });
    }
  } catch (e) {
    const hint = e.status === 401 ? " (GITHUB_TOKEN tidak valid/kedaluwarsa)" : e.status === 403 ? " (GITHUB_TOKEN tidak punya izin Contents: Read and write)" : e.status === 404 ? " (repo/branch tidak ditemukan — periksa GITHUB_REPO / GITHUB_BRANCH)" : "";
    return res.status(500).json({ error: e.message + hint });
  }
};
