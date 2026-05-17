import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Email Config (Lazy Load)
  const getTransporter = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    
    if (!user || !pass) {
      console.warn("Email credentials missing. SMTP will not send real emails.");
      return null;
    }

    return nodemailer.createTransport({
      service: "gmail", // User mentioned @gmail.com, assuming Gmail/Google Workspace
      auth: { user, pass }
    });
  };

  // AI Triage Endpoint
  app.post("/api/triage", async (req, res) => {
    const { message } = req.body;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const prompt = `
        Actúa como un asistente virtual experto para una clínica de Podología (Clínica Parrilla).
        El usuario describirá sus síntomas o lo que siente. Tu objetivo es:
        1. Analizar brevemente qué podría ser (sin dar un diagnóstico médico definitivo, siempre con precaución).
        2. Recomendar el servicio más adecuado entre: Podología General, Quiropodología, o Biomecánica (Estudio de la pisada). No menciones Fisioterapia ni Cirugía.
        3. Dar un consejo rápido de cuidado.

        Mensaje del usuario: "${message}"

        Responde en formato JSON:
        {
          "analysis": "Breve análisis",
          "recommendation": "Nombre del servicio recomendado",
          "advice": "Consejo rápido",
          "urgency": "baja/media/alta"
        }
      `;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const cleaned = response.text || "{}";
      res.json(JSON.parse(cleaned));
    } catch (error) {
      console.error("AI Error:", error);
      res.status(500).json({ error: "Fail to process AI triage" });
    }
  });

  // Booking Endpoint (Email Notify)
  app.post("/api/book", async (req, res) => {
    const { service, date, time, customer } = req.body;
    console.log("New Booking Request:", { service, date, time, customer });

    try {
      const transporter = getTransporter();
      if (transporter) {
        const mailOptions = {
          from: `"Clínica Parrilla App" <${process.env.EMAIL_USER}>`,
          to: "anaparrilla9@gmail.com",
          subject: `Nueva Cita: ${customer.name} - ${service}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #f0f0f0; padding: 40px; border-radius: 20px;">
              <h2 style="color: #1a1a1a; margin-top: 0;">Nueva solicitud de cita detectada</h2>
              <p style="color: #666;">Se ha registrado una nueva cita a través del formulario web:</p>
              
              <div style="background: #f7f5f2; padding: 25px; border-radius: 15px; margin: 20px 0;">
                <p><strong>Paciente:</strong> ${customer.name}</p>
                <p><strong>Servicio:</strong> ${service}</p>
                <p><strong>Fecha:</strong> ${date}</p>
                <p><strong>Hora:</strong> ${time}</p>
                <p><strong>Teléfono:</strong> <a href="tel:${customer.phone}">${customer.phone}</a></p>
                <p><strong>Email:</strong> ${customer.email}</p>
              </div>

              <div style="background: #fff; border: 1px solid #eee; padding: 20px; border-radius: 15px;">
                <p style="margin-top: 0; font-weight: bold; font-size: 11px; text-transform: uppercase; color: #8e8a7e;">Notas del paciente:</p>
                <p style="margin-bottom: 0; color: #444;">${customer.notes || "Sin notas adicionales."}</p>
              </div>

              <p style="font-size: 12px; color: #aaa; margin-top: 30px; text-align: center;">Este es un mensaje automático de tu sistema de gestión de citas.</p>
            </div>
          `
        };

        await transporter.sendMail(mailOptions);
        console.log("Email sent successfully to anaparrilla9@gmail.com");
      }

      res.status(200).json({ success: true, message: "Booking received" });
    } catch (error) {
      console.error("Booking Error:", error);
      res.status(500).json({ success: false, error: "Failed to send notification" });
    }
  });

  // Vite middleware for development
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
