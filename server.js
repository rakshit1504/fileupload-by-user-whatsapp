import express from "express";
import axios from "axios";
import fs from "fs/promises";
import path from "path";
import { uploadFileToSupabase } from "./uploadToSupabase.js";


const app = express();
app.use(express.json());


const {
  WEBHOOK_VERIFY_TOKEN,
  GRAPH_API_TOKEN,
  PORT = 3000,
  PHONE_NUMBER_ID,
} = process.env;



const userState = {}; 
const API_BASE_URL = "https://graph.facebook.com/v18.0";

// Send a message using a template
async function sendTemplate(to, templateName, components = []) {
  await axios.post(
    `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`,
    
    {
      messaging_product: "whatsapp",
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: "en_US" },
        components,
      },
    },
    
    
    {
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  console.log(`📤 Sent template "${templateName}" to ${to}`);
}

// Send a regular text message
async function sendText(to, text) {
  await axios.post(
    `${API_BASE_URL}/${PHONE_NUMBER_ID}/messages`,
    {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body: text },
    },
    {
      headers: {
        Authorization: `Bearer ${GRAPH_API_TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  console.log(`📤 Sent text to ${to}: "${text}"`);
}

app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token === WEBHOOK_VERIFY_TOKEN) {
    console.log("✅ Webhook verified!");
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});


app.post("/webhook", async (req, res) => {
  const body = req.body;

  if (body.object === "whatsapp_business_account") {
    for (const entry of body.entry) {
      const changes = entry.changes;
      for (const change of changes) {
        const value = change.value;

        if (value.messages) {
          for (const message of value.messages) {
            const from = message.from;
            const msgType = message.type;
            if (!userState[from]) userState[from] = {};
            const user = userState[from];

            console.log(
              "📩 Received webhook:",
              JSON.stringify(message, null, 2)
            );

            // 📝 Handle text messages
            if (msgType === "text") {
              const text = message.text.body.toLowerCase();
              const isGreeting = ["hi", "hello", "hey"].includes(text);

              if (!user.stage || (user.stage === "done" && isGreeting)) {
                await sendTemplate(from, "graduation");
                userState[from] = { stage: "graduation" };
              } else if (user.stage === "nodegree") {
                await sendText(
                  from,
                  `Thanks! We've recorded your course: "${text.toUpperCase()}"`
                );
                userState[from] = { stage: "done", course: text };
              }
            }

            if (msgType === "button") {
              const payload = message.button.payload;
              console.log(`🖲️ Button clicked: ${payload} by ${from}`);

              if (user.stage === "graduation") {
                if (payload === "Yes") {
                  await sendTemplate(from, "degree");
                  userState[from] = { stage: "degree" };
                } else if (payload === "No") {
                  await sendTemplate(from, "nodegree");
                  userState[from] = { stage: "nodegree" };
                }
              } else if (user.stage === "degree") {
                await sendText(from, "Thank you! please provide certificate in pdf form");
                userState[from] = { stage: "done" };
              } else if (user.stage === "nodegree") {
                await sendText(from, "Thank you for the information!");
                userState[from] = { stage: "done" };
              }
            }

            if (msgType === "document" && message.document.mime_type === "application/pdf") {
              try {
                const mediaId = message.document.id;
                const filename = message.document.filename;

                // 1. Get file URL from Meta API
                const mediaRes = await axios.get(
                  `${API_BASE_URL}/${mediaId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                    },
                  }
                );
                const mediaUrl = mediaRes.data.url;

                // 2. Download the file
                const fileRes = await axios.get(mediaUrl, {
                  headers: {
                    Authorization: `Bearer ${GRAPH_API_TOKEN}`,
                  },
                  responseType: "arraybuffer",
                });

                const tempPath = path.join("/tmp", `${Date.now()}_${filename}`);
                await fs.writeFile(tempPath, fileRes.data);

                // 3. Upload to Supabase
                const fileUrl = await uploadFileToSupabase(tempPath, filename, from);

                // 4. Confirm to user
                await sendText(from, `✅ Certificate received and saved!\n📎 View: ${fileUrl}`);

                // 5. Cleanup
                await fs.unlink(tempPath);
              } catch (error) {
                console.error("❌ Error handling PDF upload:", error.message);
                await sendText(from, "⚠️ Error saving your certificate. Please try again.");
              }
            }
          }
        }
      }
    }

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});



// 🚀 Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});


