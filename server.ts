import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { parse } from "csv-parse/sync";
import { stringify } from "csv-stringify/sync";

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const USERS_FILE = path.join(DATA_DIR, "users.csv");
const QUESTIONS_FILE = path.join(DATA_DIR, "questions.csv");
const ADMINS_FILE = path.join(DATA_DIR, "admins.csv");

const readCsv = (filePath: string): any[] => {
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, "utf-8");
  if (!content.trim()) return [];
  return parse(content, { columns: true, skip_empty_lines: true });
};

const writeCsv = (filePath: string, data: any[]) => {
  const content = data.length > 0 ? stringify(data, { header: true }) : "";
  fs.writeFileSync(filePath, content, "utf-8");
};

// Initialize Admin
if (!fs.existsSync(ADMINS_FILE)) {
  writeCsv(ADMINS_FILE, [{ username: "fazcollege2026", password: "FAZCOLLEGE2026", role: "main_admin" }]);
}

const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

const loadSettings = () => {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return {
      isLive: false,
      round: 1,
      questionCount: 10,
      timeMinutes: 30
    };
  }
  return JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf-8"));
};
const saveSettings = (settings: any) => {
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
};

let examSettings = loadSettings();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // === ADMIN AUTH ROUTES ===
  app.post("/api/admin/login", (req, res) => {
    const { username, password } = req.body;
    const admins = readCsv(ADMINS_FILE);
    const admin = admins.find(a => a.username === username && a.password === password);
    if (admin) {
      res.json({ success: true, role: admin.role, username: admin.username });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.get("/api/admin/subadmins", (req, res) => {
    const admins = readCsv(ADMINS_FILE).filter(a => a.role === 'sub_admin');
    const safeAdmins = admins.map(a => ({ username: a.username, password: a.password }));
    res.json({ success: true, subadmins: safeAdmins });
  });

  app.post("/api/admin/remove-subadmin", (req, res) => {
    const { username, creatorRole } = req.body;
    if (creatorRole !== 'main_admin') return res.status(403).json({ success: false });
    
    let admins = readCsv(ADMINS_FILE);
    admins = admins.filter(a => !(a.username === username && a.role === 'sub_admin'));
    writeCsv(ADMINS_FILE, admins);
    res.json({ success: true });
  });

  app.post("/api/admin/add-subadmin", (req, res) => {
    const { username, password, creatorRole } = req.body;
    // Basic check, in reality use middleware
    if (creatorRole !== 'main_admin' && creatorRole !== 'sub_admin') return res.status(403).json({ success: false });
    
    const admins = readCsv(ADMINS_FILE);
    if (admins.find(a => a.username === username)) {
      return res.status(400).json({ success: false, message: "Username exists" });
    }
    admins.push({ username, password, role: "sub_admin" });
    writeCsv(ADMINS_FILE, admins);
    res.json({ success: true });
  });

  app.post("/api/admin/change-password", (req, res) => {
    const { username, oldPassword, newPassword } = req.body;
    let admins = readCsv(ADMINS_FILE);
    const adminIndex = admins.findIndex(a => a.username === username && a.password === oldPassword);
    
    if (adminIndex !== -1) {
      if (admins[adminIndex].role !== "main_admin") {
        return res.status(403).json({ success: false, message: "Sub-admins cannot change passwords" });
      }
      admins[adminIndex].password = newPassword;
      writeCsv(ADMINS_FILE, admins);
      res.json({ success: true, message: "Password updated successfully" });
    } else {
      res.status(401).json({ success: false, message: "Incorrect old password" });
    }
  });

  // === STUDENT ROUTES ===
  app.post("/api/register", async (req, res) => {
    const data = req.body;
    const users = readCsv(USERS_FILE);
    const serial = (users.length + 1).toString().padStart(3, '0');
    const studentId = `FAZSC2${serial}`;
    const password = Math.random().toString(36).slice(-8);

    const newUser = {
      id: studentId,
      password,
      status: "active",
      score: "0",
      ...data
    };
    
    users.push(newUser);
    writeCsv(USERS_FILE, users);

    console.log(`[EMAIL SENT] To: ${data.parentEmail} | Body: Welcome! ID: ${studentId}, Pass: ${password}`);

    res.json({ success: true, studentId, password });
  });

  app.post("/api/login", (req, res) => {
    const { studentId, password } = req.body;
    const users = readCsv(USERS_FILE);
    const user = users.find(u => u.id === studentId && u.password === password);
    
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid Student ID or Password." });
    }
    
    if (user.status === "deactivated") {
      return res.status(401).json({ success: false, message: "Access Denied: You have been disqualified from the challenge." });
    }
    
    if (user.status === "deleted") {
      return res.status(401).json({ success: false, message: "Access Denied." });
    }

    res.json({ success: true, user: { id: user.id, status: user.status, studentName: user.studentName } });
  });

  // Exam Status
  app.get("/api/exam/status", (req, res) => {
    res.json({ success: true, settings: examSettings });
  });

  app.get("/api/exam/questions", (req, res) => {
    if (!examSettings.isLive) return res.status(403).json({ success: false, message: "Exam offline" });
    const questions = readCsv(QUESTIONS_FILE);
    const roundQuestions = questions.filter(q => parseInt(q.round) === examSettings.round || !q.round);
    res.json({ success: true, questions: roundQuestions.slice(0, examSettings.questionCount) });
  });

  app.post("/api/grade", (req, res) => {
    const { studentId, answers } = req.body; // e.g. { '1': 'A' }
    const questions = readCsv(QUESTIONS_FILE);
    
    let score = 0;
    questions.forEach(q => {
      const studentAnswer = answers[String(q.id).trim()];
      if (studentAnswer && studentAnswer.trim().toUpperCase() === String(q.correct).trim().toUpperCase()) {
        score++;
      }
    });

    const users = readCsv(USERS_FILE);
    const uIndex = users.findIndex(u => u.id === studentId);
    if (uIndex > -1) {
      // Store overall score or update it
      users[uIndex].score = score.toString();
      writeCsv(USERS_FILE, users);
    }

    res.json({ success: true, score });
  });

  // === ADMIN ACTION ROUTES ===
  app.get("/api/admin/users", (req, res) => {
    const users = readCsv(USERS_FILE).filter(u => u.status !== 'deleted');
    res.json({ success: true, users });
  });

  app.post("/api/admin/users/clear", (req, res) => {
    writeCsv(USERS_FILE, []);
    res.json({ success: true });
  });

  app.post("/api/admin/users/action", (req, res) => {
    const { ids, action } = req.body; // action: activate, deactivated, delete
    const users = readCsv(USERS_FILE);
    
    users.forEach(u => {
      if (ids.includes(u.id)) {
        u.status = action;
      }
    });

    writeCsv(USERS_FILE, users);
    res.json({ success: true });
  });

  app.post("/api/admin/settings", (req, res) => {
    examSettings = { ...examSettings, ...req.body };
    saveSettings(examSettings);
    res.json({ success: true, settings: examSettings });
  });

  app.post("/api/admin/questions/upload", (req, res) => {
    const { csvData } = req.body; // Assuming text content
    try {
      const parsed = parse(csvData, { columns: true, skip_empty_lines: true });
      writeCsv(QUESTIONS_FILE, parsed);
      res.json({ success: true, count: parsed.length });
    } catch(err) {
      res.status(400).json({ success: false, message: "Invalid CSV format" });
    }
  });

  app.post("/api/admin/questions/clear", (req, res) => {
    writeCsv(QUESTIONS_FILE, []);
    res.json({ success: true });
  });


  // === VITE MIDDLEWARE ===
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
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
