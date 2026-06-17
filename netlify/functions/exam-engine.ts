import { getSettings, getQuestions, getUsers, saveUser } from "./utils/db.ts";

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

  const path = event.path || "";
  const method = event.httpMethod;

  try {
    // 1. GET /api/exam/status
    if (path.endsWith("/status") && method === "GET") {
      const settings = await getSettings();
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, settings })
      };
    }

    // 2. GET /api/exam/questions
    if (path.endsWith("/questions") && method === "GET") {
      const settings = await getSettings();
      if (!settings.isLive) {
        return {
          statusCode: 403,
          headers,
          body: JSON.stringify({ success: false, message: "Exam offline" })
        };
      }

      const questionsList = await getQuestions(settings.round);
      
      // Slice according to config limits
      const limitedQuestions = questionsList.slice(0, settings.questionCount);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, questions: limitedQuestions })
      };
    }

    // 3. POST /api/grade
    if (path.endsWith("/grade") && method === "POST") {
      const { studentId, answers } = JSON.parse(event.body || "{}");
      if (!studentId || !answers) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ success: false, message: "Student ID and answers are required." })
        };
      }

      const settings = await getSettings();
      const questionsList = await getQuestions(settings.round);
      const activeQuestions = questionsList.slice(0, settings.questionCount);

      let score = 0;
      activeQuestions.forEach(q => {
        const studentAns = answers[String(q.id).trim()];
        const correctAns = String(q.correct).trim();
        if (studentAns && studentAns.toUpperCase() === correctAns.toUpperCase()) {
          score++;
        }
      });

      // Update student overall score
      const usersList = await getUsers();
      const user = usersList.find(u => u.id === studentId);
      if (user) {
        user.score = score.toString();
        await saveUser(user);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, score })
      };
    }

    // Fallback routing for /api/grade which is top-level redirection
    if (path.endsWith("/grade") === false && method === "POST") {
      // In case api rewrite points directly to exam-engine for grading
      const { studentId, answers } = JSON.parse(event.body || "{}");
      const settings = await getSettings();
      const questionsList = await getQuestions(settings.round);
      const activeQuestions = questionsList.slice(0, settings.questionCount);

      let score = 0;
      activeQuestions.forEach(q => {
        const studentAns = answers[String(q.id).trim()];
        const correctAns = String(q.correct).trim();
        if (studentAns && studentAns.toUpperCase() === correctAns.toUpperCase()) {
          score++;
        }
      });

      const usersList = await getUsers();
      const user = usersList.find(u => u.id === studentId);
      if (user) {
        user.score = score.toString();
        await saveUser(user);
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ success: true, score })
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ success: false, message: "Endpoint not found" })
    };
  } catch (err: any) {
    console.error("Exam engine error:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ success: false, message: "Server error during grading or challenge orchestration." })
    };
  }
};
