import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// ============================================================
// SINKRON JURNAL GURU -> DASHBOARD KEPALA SEKOLAH (per NPSN)
// Jurnal yang "dikirim" guru disimpan ke berkas JSON di server,
// lalu dashboard kepala sekolah mengambil semua jurnal milik
// NPSN yang sama. Dengan ini data terbaca lintas perangkat.
// ============================================================
const DATA_DIR = path.join(process.cwd(), "data");
const SYNC_FILE = path.join(DATA_DIR, "journal-sync.json");

// Data tambahan lintas perangkat: status login guru + daftar guru upload kepsek
const SCHOOL_DATA_FILE = path.join(DATA_DIR, "school-data.json");

interface SchoolJournalInbox {
  npsn: string;
  namaSekolah: string;
  updatedAt: string;
  journals: any[];
}

interface GuruRowData {
  npsn: string;
  nama: string;
  nip: string;
  kelas: string;
}

interface GuruLoginRecord {
  nip: string;
  nama: string;
  npsn: string;
  namaSekolah: string;
  ts: number;
}

interface SchoolDataStore {
  logins: Record<string, GuruLoginRecord>;
  guruRows: Record<string, { npsn: string; namaSekolah: string; rows: GuruRowData[]; updatedAt: string }>;
}

function loadSyncStore(): Record<string, SchoolJournalInbox> {
  try {
    if (fs.existsSync(SYNC_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SYNC_FILE, "utf-8"));
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (err) {
    console.error("Gagal membaca journal-sync.json:", err);
  }
  return {};
}

function saveSyncStore(store: Record<string, SchoolJournalInbox>) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SYNC_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan journal-sync.json:", err);
  }
}

function loadSchoolData(): SchoolDataStore {
  try {
    if (fs.existsSync(SCHOOL_DATA_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(SCHOOL_DATA_FILE, "utf-8"));
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch (err) {
    console.error("Gagal membaca school-data.json:", err);
  }
  return { logins: {}, guruRows: {} };
}

function saveSchoolData(store: SchoolDataStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(SCHOOL_DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
  } catch (err) {
    console.error("Gagal menyimpan school-data.json:", err);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "25mb" }));

  // ===== SINKRON JURNAL PER SEKOLAH (NPSN) =====
  // Guru mengirim jurnal: { npsn, namaSekolah, journals }
  app.post("/api/journal/sync", (req, res) => {
    try {
      const { npsn, namaSekolah, journals } = req.body || {};
      const cleanNpsn = String(npsn || "").trim().replace(/\s+/g, "");
      if (!cleanNpsn || !Array.isArray(journals)) {
        return res.status(400).json({ error: "Parameter npsn & journals wajib." });
      }
      const store = loadSyncStore();
      const prev = store[cleanNpsn] || { npsn: cleanNpsn, namaSekolah: String(namaSekolah || ""), updatedAt: new Date().toISOString(), journals: [] };
      // Gabungkan tanpa duplikat (berdasarkan id jurnal)
      const seen = new Set<string>();
      const merged: any[] = [];
      [...prev.journals, ...journals].forEach((j) => {
        if (j && j.id && !seen.has(j.id)) {
          seen.add(j.id);
          merged.push(j);
        }
      });
      store[cleanNpsn] = {
        npsn: cleanNpsn,
        namaSekolah: String(namaSekolah || prev.namaSekolah || ""),
        updatedAt: new Date().toISOString(),
        journals: merged
      };
      saveSyncStore(store);
      return res.json({ ok: true, count: merged.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Gagal sinkron jurnal." });
    }
  });

  // Kepala sekolah mengambil jurnal: GET /api/journal/sync?npsn=...
  app.get("/api/journal/sync", (req, res) => {
    try {
      const npsn = String(req.query.npsn || "").trim().replace(/\s+/g, "");
      const school = String(req.query.school || "").trim().toLowerCase().replace(/\s+/g, "");
      const store = loadSyncStore();
      const normalize = (s: string) => (s || "").trim().toLowerCase().replace(/\s+/g, "");
      const merged: any[] = [];
      const seen = new Set<string>();
      const pushInbox = (inbox: any) => {
        (inbox.journals || []).forEach((j: any) => {
          if (j && j.id && !seen.has(j.id)) {
            seen.add(j.id);
            merged.push(j);
          }
        });
      };
      const inboxMatches = (s: any): boolean => {
        if (npsn && normalize(s.npsn) === npsn) return true;
        if (school && normalize(s.namaSekolah) === school) return true;
        // Guru yang mendaftar dengan NPSN sendiri tapi sekolah sama: cocokkan
        // lewat identitas sekolah yang dibawa tiap jurnal.
        if (npsn || school) {
          return (s.journals || []).some((j: any) => {
            if (npsn && j && j.sekolahNpsn && normalize(j.sekolahNpsn) === npsn) return true;
            if (school && j && j.sekolahNama && normalize(j.sekolahNama) === school) return true;
            return false;
          });
        }
        return false;
      };
      // 1) npsn diminta -> cari inbox dengan NPSN tsb
      if (npsn) {
        const inbox = store[npsn];
        if (inbox) pushInbox(inbox);
        // 2) jangan berhenti: bila ada guru lain dengan NPSN berbeda tapi sekolah
        //    yang sama, sertakan juga (cocokkan nama sekolah / identitas jurnal).
        Object.values(store).forEach((s) => {
          if (s !== inbox && inboxMatches(s)) pushInbox(s);
        });
        return res.json({ npsn, journals: merged });
      }
      // 3) school (nama sekolah) diminta -> gabungkan jurnal dari SEMUA inbox
      //    milik sekolah tsb, walaupun tiap guru memakai NPSN masing-masing.
      if (school) {
        Object.values(store).forEach((s) => {
          if (inboxMatches(s)) pushInbox(s);
        });
        return res.json({ school, journals: merged });
      }
      // Tanpa parameter -> kirim daftar ringkas semua sekolah (untuk pencocokan nama sekolah)
      const list = Object.values(store).map((s) => ({
        npsn: s.npsn,
        namaSekolah: s.namaSekolah,
        count: s.journals.length
      }));
      return res.json({ schools: list });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Gagal mengambil jurnal." });
    }
  });

  // ===== STATUS LOGIN GURU (lintas perangkat) =====
  // Guru menandai dirinya login: POST /api/guru-login { nip, nama, npsn, namaSekolah }
  app.post("/api/guru-login", (req, res) => {
    try {
      const { nip, nama, npsn, namaSekolah } = req.body || {};
      const cleanNip = String(nip || "").trim().replace(/\s+/g, "");
      if (!cleanNip) {
        return res.status(400).json({ error: "Parameter nip wajib." });
      }
      const store = loadSchoolData();
      store.logins[cleanNip] = {
        nip: cleanNip,
        nama: String(nama || ""),
        npsn: String(npsn || "").trim().replace(/\s+/g, ""),
        namaSekolah: String(namaSekolah || ""),
        ts: Date.now()
      };
      saveSchoolData(store);
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Gagal menandai login guru." });
    }
  });

  // Guru logout: POST /api/guru-logout { nip }
  app.post("/api/guru-logout", (req, res) => {
    try {
      const { nip } = req.body || {};
      const cleanNip = String(nip || "").trim().replace(/\s+/g, "");
      const store = loadSchoolData();
      if (cleanNip && store.logins[cleanNip]) {
        delete store.logins[cleanNip];
        saveSchoolData(store);
      }
      return res.json({ ok: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Gagal menandai logout guru." });
    }
  });

  // Kepala sekolah mengambil status login guru per NPSN / nama sekolah:
  // GET /api/guru-login?npsn=... atau GET /api/guru-login?school=...
  app.get("/api/guru-login", (req, res) => {
    try {
      const npsn = String(req.query.npsn || "").trim().replace(/\s+/g, "");
      const school = String(req.query.school || "").trim().toLowerCase().replace(/\s+/g, "");
      const store = loadSchoolData();
      let logins = Object.values(store.logins);
      if (npsn) {
        logins = logins.filter((l) => l.npsn === npsn);
      }
      if (school) {
        logins = logins.filter((l) => String(l.namaSekolah || "").trim().toLowerCase().replace(/\s+/g, "") === school);
      }
      return res.json({ logins });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Gagal mengambil status login guru." });
    }
  });

  // ===== DAFTAR GURU (upload kepsek) lintas perangkat =====
  // Kepsek menyimpan daftar guru: POST /api/guru-rows { npsn, namaSekolah, rows }
  app.post("/api/guru-rows", (req, res) => {
    try {
      const { npsn, namaSekolah, rows } = req.body || {};
      const cleanNpsn = String(npsn || "").trim().replace(/\s+/g, "");
      if (!cleanNpsn || !Array.isArray(rows)) {
        return res.status(400).json({ error: "Parameter npsn & rows wajib." });
      }
      const store = loadSchoolData();
      store.guruRows[cleanNpsn] = {
        npsn: cleanNpsn,
        namaSekolah: String(namaSekolah || ""),
        rows,
        updatedAt: new Date().toISOString()
      };
      saveSchoolData(store);
      return res.json({ ok: true, count: rows.length });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Gagal menyimpan daftar guru." });
    }
  });

  // Kepsek mengambil daftar guru: GET /api/guru-rows?npsn=... atau ?school=...
  app.get("/api/guru-rows", (req, res) => {
    try {
      const npsn = String(req.query.npsn || "").trim().replace(/\s+/g, "");
      const school = String(req.query.school || "").trim().toLowerCase().replace(/\s+/g, "");
      const store = loadSchoolData();
      let entries = Object.values(store.guruRows);
      if (npsn) {
        entries = entries.filter((s) => s.npsn === npsn);
      }
      if (school) {
        entries = entries.filter((s) => String(s.namaSekolah || "").trim().toLowerCase().replace(/\s+/g, "") === school);
      }
      // Pilih yang terbaru
      entries.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
      return res.json({
        rows: entries.length > 0 ? entries[0].rows : [],
        updatedAt: entries.length > 0 ? entries[0].updatedAt : ""
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Gagal mengambil daftar guru." });
    }
  });

  // API Endpoint for KoJaS AI processing (scanning keys, scanning student answers, grading essays)
  app.post("/api/kojas-ai", async (req, res) => {
    try {
      const { prompt, imageBase64 } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY tidak dikonfigurasi di server." });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const contentsParts: any[] = [{ text: prompt }];
      if (imageBase64) {
        // Strip data header if present
        const cleanBase64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
        contentsParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: cleanBase64,
          },
        });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: { parts: contentsParts },
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      });

      const responseText = response.text || "";
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/gi, "").replace(/```/g, "").trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json({ result: parsedData });
    } catch (err: any) {
      console.error("Error in /api/kojas-ai:", err);
      return res.status(500).json({ error: err.message || "Gagal memproses AI" });
    }
  });

  // Vite middleware in development or static file serving in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`BAKUMPUL server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
