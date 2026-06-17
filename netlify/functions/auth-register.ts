import { saveUser, getUsers, StudentUser, db } from "./utils/db.ts";
import { collection, getDocs } from "firebase/firestore";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

export const handler = async (event: any) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ success: false, message: "Method not allowed" })
    };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    
    if (!data.studentName || !data.parentName || !data.parentEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Required registration fields are missing." })
      };
    }

    // Generate next serial code (e.g. FAZSC2001, FAZSC2002...) safely across all documents
    const colRef = collection(db, "users");
    const snapshot = await getDocs(colRef);
    let maxSerial = 0;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const id = data.id || docSnap.id;
      if (id) {
        const match = id.match(/^FAZSC2(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxSerial) {
            maxSerial = num;
          }
        }
      }
    });

    const nextSerial = (maxSerial + 1).toString().padStart(3, "0");
    const studentId = `FAZSC2${nextSerial}`;
    const password = Math.random().toString(36).slice(-8);

    const newUser: StudentUser = {
      id: studentId,
      password, // Password is plain here for display, saveUser digests it with bcrypt
      passwordClear: password, // Store plain text copy for admin visibility
      status: "active",
      score: "0",
      studentName: data.studentName,
      dob: data.dob || "",
      parentName: data.parentName,
      parentEmail: data.parentEmail,
      parentPhone: data.parentPhone || "",
      school: data.school || "",
      studentClass: data.studentClass || "",
      teacherName: data.teacherName || "",
      teacherEmail: data.teacherEmail || "",
      teacherPhone: data.teacherPhone || ""
    };

    await saveUser(newUser);

    // Mimic transactional email logs
    console.log(`[EMAIL SENT] To: ${newUser.parentEmail} | Body: Welcome! ID: ${studentId}, Pass: ${password}`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        studentId,
        password
      })
    };
  } catch (err: any) {
    console.error("Registration error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: err.message || "Server error during registration." })
    };
  }
};
