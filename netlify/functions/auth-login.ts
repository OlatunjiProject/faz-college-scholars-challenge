import { getUsers } from "./utils/db.ts";
import bcrypt from "bcryptjs";

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
    const { studentId, password } = JSON.parse(event.body || "{}");
    if (!studentId || !password) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ success: false, message: "Student ID and password are required" })
      };
    }

    const users = await getUsers();
    const user = users.find(u => u.id.trim().toUpperCase() === studentId.trim().toUpperCase());

    if (!user) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid Student ID or Password." })
      };
    }

    let isPasswordCorrect = false;
    if (user && user.password) {
      if (user.password.startsWith("$2")) {
        isPasswordCorrect = bcrypt.compareSync(password, user.password);
      } else {
        isPasswordCorrect = (user.password === password);
      }
    }

    if (!isPasswordCorrect) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: "Invalid Student ID or Password." })
      };
    }

    if (user.status === "deactivated") {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: "Access Denied: You have been disqualified from the challenge." })
      };
    }

    if (user.status === "deleted") {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ success: false, message: "Access Denied." })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          id: user.id,
          status: user.status,
          studentName: user.studentName
        }
      })
    };
  } catch (err: any) {
    console.error("Login failure:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: err.message || "Server error during login" })
    };
  }
};
