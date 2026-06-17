import express from "express";
import { createServer as createViteServer } from "vite";

// Import modern Netlify serverless functions directly
import { handler as loginHandler } from "./netlify/functions/auth-login.ts";
import { handler as registerHandler } from "./netlify/functions/auth-register.ts";
import { handler as adminHandler } from "./netlify/functions/admin-portal.ts";
import { handler as examHandler } from "./netlify/functions/exam-engine.ts";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and text bodies
  app.use(express.json());
  app.use(express.text({ type: "*/*" }));

  // Simulational bridge to translate Express (req, res) to Netlify lambda (event, context)
  const bridge = async (handler: any, req: any, res: any) => {
    try {
      // Netlify functions expect body as a string containing post values
      let requestBody = "";
      if (req.body) {
        if (typeof req.body === "object") {
          requestBody = JSON.stringify(req.body);
        } else {
          requestBody = String(req.body);
        }
      }

      const event = {
        httpMethod: req.method,
        path: req.originalUrl.split("?")[0], // Keep clean relative path mappings
        body: requestBody,
        queryStringParameters: req.query || {},
        headers: req.headers || {}
      };

      const lambdaResponse = await handler(event, {});

      if (lambdaResponse.headers) {
        Object.entries(lambdaResponse.headers).forEach(([key, val]) => {
          res.set(key, val as string);
        });
      }

      res.status(lambdaResponse.statusCode || 200).send(lambdaResponse.body);
    } catch (err) {
      console.error("Local Serverless Dev Proxy Error:", err);
      res.status(500).json({ success: false, message: "Local Netlify proxy failure" });
    }
  };

  // Bind Express REST routes to Serverless lambdas
  app.all("/api/login", (req, res) => bridge(loginHandler, req, res));
  app.all("/api/register", (req, res) => bridge(registerHandler, req, res));
  app.all("/api/grade", (req, res) => bridge(examHandler, req, res));
  app.all("/api/exam/*", (req, res) => bridge(examHandler, req, res));
  app.all("/api/admin/*", (req, res) => bridge(adminHandler, req, res));

  // Static files and Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => {
      res.sendFile("dist/index.html", { root: process.cwd() });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Local dev proxy running on http://localhost:${PORT}`);
  });
}

startServer();
