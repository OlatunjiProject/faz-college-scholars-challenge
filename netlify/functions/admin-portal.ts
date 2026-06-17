import { 
  getAdmins, 
  saveAdmin, 
  removeAdmin, 
  getAdmin, 
  getUsers, 
  clearUsers, 
  updateUserStatus, 
  getSettings, 
  saveSettings, 
  saveQuestions, 
  clearQuestions,
  AdminUser,
  QuestionType,
  getQuestions,
  deleteQuestion
} from "./utils/db.ts";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(csvText: string): any[] {
  const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  
  const headers = parseCSVLine(lines[0]);
  const result: any[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const obj: any = {};
    headers.forEach((header, idx) => {
      // Normalize common keys
      const cleanHeader = header.trim();
      obj[cleanHeader] = values[idx] || "";
    });
    result.push(obj);
  }
  return result;
}

const JWT_SECRET = process.env.JWT_SECRET || "faz-scholars-challenge-secret-key-2026";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

// Stateless Authorization (JWT) extraction and verification helper
function getAuthAdmin(event: any): any {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader) return null;
  
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  
  const token = parts[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  const path = event.path || "";
  const method = event.httpMethod;

  try {
    // 0. GET or POST /api/admin/has-admin
    if (path.endsWith("/has-admin")) {
      const admins = await getAdmins();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, hasAdmin: admins.length > 0 })
      };
    }

    // 0.1 POST /api/admin/setup-initial
    if (path.endsWith("/setup-initial") && method === "POST") {
      const admins = await getAdmins();
      if (admins.length > 0) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: "Initial setup already completed." })
        };
      }

      const { username, password, recoveryEmail, recoveryQuestion, recoveryAnswer } = JSON.parse(event.body || "{}");
      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: "Username and password are required." })
        };
      }

      const newAdmin: AdminUser = {
        username: username.trim(),
        password: password,
        role: "main_admin",
        recoveryEmail: recoveryEmail || "admin@fazcollege.com.ng",
        recoveryQuestion: recoveryQuestion || "What is your favorite academic subject?",
        recoveryAnswer: recoveryAnswer || "Mathematics"
      };

      await saveAdmin(newAdmin);
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, message: "Primary Administrator account created successfully!" })
      };
    }

    // 1. POST /api/admin/login
    if (path.endsWith("/login") && method === "POST") {
      const { username, password } = JSON.parse(event.body || "{}");
      const admins = await getAdmins();
      const admin = admins.find(a => a.username === username);
      
      let isPasswordCorrect = false;
      if (admin) {
        if (admin.password && admin.password.startsWith("$2")) {
          isPasswordCorrect = bcrypt.compareSync(password, admin.password);
        } else {
          isPasswordCorrect = (admin.password === password);
        }
      }

      if (admin && isPasswordCorrect) {
        // Issue stateless JSON Web Token (JWT) expiring in 2 hours
        const token = jwt.sign(
          { username: admin.username, role: admin.role },
          JWT_SECRET,
          { expiresIn: "2h" }
        );
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ 
            success: true, 
            token, 
            role: admin.role, 
            username: admin.username 
          })
        };
      } else {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ success: false, message: "Invalid credentials" })
        };
      }
    }

    // 2. GET /api/admin/subadmins
    if (path.endsWith("/subadmins") && method === "GET") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const admins = await getAdmins();
      const subs = admins.filter(a => a.role === "sub_admin").map(a => ({
        username: a.username,
        password: a.password
      }));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, subadmins: subs })
      };
    }

    // 3. POST /api/admin/remove-subadmin
    if (path.endsWith("/remove-subadmin") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser || decodedUser.role !== "main_admin") {
        return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Only main_admin can remove sub-admins" }) };
      }

      const { username } = JSON.parse(event.body || "{}");
      await removeAdmin(username);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // 4. POST /api/admin/add-subadmin
    if (path.endsWith("/add-subadmin") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser || decodedUser.role !== "main_admin") {
        return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Only main_admin can create sub-admins" }) };
      }

      const { username, password } = JSON.parse(event.body || "{}");
      const existing = await getAdmin(username);
      if (existing) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: "Username exists" }) };
      }
      
      // Save original payload (saveAdmin takes care of cryptographic bcrypt hashing internally)
      await saveAdmin({ username, password, role: "sub_admin" });
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // 5. GET /api/admin/credentials
    if (path.endsWith("/credentials") && method === "GET") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const qs = event.queryStringParameters || {};
      const username = qs.username;
      const admin = await getAdmin(username);
      if (admin) {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            username: admin.username,
            recoveryEmail: admin.recoveryEmail,
            recoveryQuestion: admin.recoveryQuestion
          })
        };
      }
      return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: "Admin not found" }) };
    }

    // 6. POST /api/admin/change-credentials
    if (path.endsWith("/change-credentials") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser || decodedUser.role !== "main_admin") {
        return { statusCode: 403, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Only main_admin can change credentials" }) };
      }

      const { username, oldPassword, newUsername, newPassword, recoveryEmail, recoveryQuestion, recoveryAnswer } = JSON.parse(event.body || "{}");
      const admin = await getAdmin(username);

      let isOldPasswordCorrect = false;
      if (admin) {
        if (admin.password && admin.password.startsWith("$2")) {
          isOldPasswordCorrect = bcrypt.compareSync(oldPassword, admin.password);
        } else {
          isOldPasswordCorrect = (admin.password === oldPassword);
        }
      }

      if (admin && isOldPasswordCorrect) {
        if (newUsername && newUsername !== username) {
          const checkExists = await getAdmin(newUsername);
          if (checkExists) {
            return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: "The new username is already taken" }) };
          }
          // Delete old entry in db/CSV when renamed
          await removeAdmin(username);
        }

        const updatedAdmin: AdminUser = {
          username: newUsername || username,
          password: newPassword || admin.password,
          role: "main_admin",
          recoveryEmail: recoveryEmail || admin.recoveryEmail,
          recoveryQuestion: recoveryQuestion || admin.recoveryQuestion,
          recoveryAnswer: recoveryAnswer || admin.recoveryAnswer
        };

        await saveAdmin(updatedAdmin);

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Credentials updated successfully",
            username: updatedAdmin.username
          })
        };
      }
      return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Incorrect previous password" }) };
    }

    // 7. POST /api/admin/recovery-info
    if (path.endsWith("/recovery-info") && method === "POST") {
      const { username } = JSON.parse(event.body || "{}");
      const admin = await getAdmin(username);
      if (!admin) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: "Admin username not found" }) };
      }

      const email = admin.recoveryEmail || "admin@fazcollege.com.ng";
      let maskedEmail = "***";
      if (email.includes("@")) {
        const parts = email.split("@");
        const name = parts[0];
        const domain = parts[1];
        maskedEmail = name.charAt(0) + "***" + (name.length > 2 ? name.charAt(name.length - 1) : "") + "@" + domain;
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          recoveryQuestion: admin.recoveryQuestion || "What is your favorite academic subject?",
          maskedEmail
        })
      };
    }

    // 8. POST /api/admin/recover
    if (path.endsWith("/recover") && method === "POST") {
      const { username, recoveryAnswer, newPassword } = JSON.parse(event.body || "{}");
      const admin = await getAdmin(username);
      if (!admin) {
        return { statusCode: 404, headers, body: JSON.stringify({ success: false, message: "Admin username not found" }) };
      }

      const registered = (admin.recoveryAnswer || "Mathematics").trim().toLowerCase();
      const submitted = (recoveryAnswer || "").trim().toLowerCase();

      if (submitted === registered) {
        admin.password = newPassword;
        await saveAdmin(admin);
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ success: true, message: "Password reset successfully. Please login with your new password." })
        };
      }
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: "Incorrect security question answer" }) };
    }

    // 9. GET /api/admin/users
    if (path.endsWith("/users") && method === "GET") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const users = await getUsers();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, users }) };
    }

    // 10. POST /api/admin/users/clear
    if (path.endsWith("/users/clear") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      await clearUsers();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // 11. POST /api/admin/users/action
    if (path.endsWith("/users/action") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const { ids, action } = JSON.parse(event.body || "{}");
      await updateUserStatus(ids, action);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // 12. POST /api/admin/settings
    if (path.endsWith("/settings") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const current = await getSettings();
      const bodyParams = JSON.parse(event.body || "{}");
      const updated = { ...current, ...bodyParams };
      await saveSettings(updated);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, settings: updated }) };
    }

    // 13. POST /api/admin/questions/upload
    if (path.endsWith("/questions/upload") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const { csvData } = JSON.parse(event.body || "{}");
      try {
        const parsed = parseCSV(csvData);
        
        // Ensure options map flat properties: id, text, optionA, optionB, optionC, optionD, correct
        const formattedList: Partial<QuestionType>[] = parsed.map((q: any, idx: number) => ({
          id: parseInt(q.id || String(idx + 1)),
          subject: q.subject || "General",
          text: q.text || q.question || "",
          optionA: q.optionA || q.option_a || "",
          optionB: q.optionB || q.option_b || "",
          optionC: q.optionC || q.option_c || "",
          optionD: q.optionD || q.option_d || "",
          correct: q.correct || "",
          round: (q.round !== undefined && q.round !== "") ? parseInt(q.round) : undefined
        }));

        await saveQuestions(formattedList);
        return { statusCode: 200, headers, body: JSON.stringify({ success: true, count: formattedList.length }) };
      } catch (err) {
        console.error("CSV parse error:", err);
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: "Invalid CSV format" }) };
      }
    }

    // 14. POST /api/admin/questions/clear
    if (path.endsWith("/questions/clear") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      await clearQuestions();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    // 15. GET /api/admin/questions
    if (path.endsWith("/questions") && method === "GET") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const questions = await getQuestions();
      return { statusCode: 200, headers, body: JSON.stringify({ success: true, questions }) };
    }

    // 16. POST /api/admin/questions/delete
    if (path.endsWith("/questions/delete") && method === "POST") {
      const decodedUser = getAuthAdmin(event);
      if (!decodedUser) {
        return { statusCode: 401, headers, body: JSON.stringify({ success: false, message: "Unauthorized: Invalid or missing token" }) };
      }

      const { docId } = JSON.parse(event.body || "{}");
      if (!docId) {
        return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: "docId is required" }) };
      }

      await deleteQuestion(docId);
      return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: "Endpoint not found" })
    };
  } catch (err: any) {
    console.error("Admin dashboard exception:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Server error executing administrative action" })
    };
  }
};
