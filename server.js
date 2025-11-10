import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
// --- Google Sheet Webhook ---
const GOOGLE_SHEET_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxnmGLbNvxkfgCLE2g3icR5cH_W4CrH4il-Ut68_9e4Nwdg-0zYwxNYLbkjapSSQeywGQ/exec";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Your Strava credentials
const CLIENT_ID = "184379";
const CLIENT_SECRET = "67de8f5f852e1e8037e1764feebbc1f5401458b8";
const REDIRECT_URI = "https://zixa-nsp.onrender.com/exchange_token";
// --- Send token info to Google Sheet ---
async function saveToGoogleSheet(data) {
  try {
    await axios.post(GOOGLE_SHEET_WEBHOOK_URL, {
      created_at: new Date().toISOString(),
      athlete_id: data.athlete?.id || "",
      athlete_name: `${data.athlete?.firstname || ""} ${data.athlete?.lastname || ""}`.trim(),
      username: data.athlete?.username || "",
      access_token_tail: (data.access_token || "").slice(-6),
      refresh_token_tail: (data.refresh_token || "").slice(-6),
      expires_at: data.expires_at || ""
    });
    console.log("✅ Token info saved to Google Sheet");
  } catch (err) {
    console.error("❌ Failed to save to Google Sheet:", err.message);
  }
}

// Home route
app.get("/", (req, res) => {
  res.send("ZIXA Strong Strava Verifier is Running 🏃‍♂️");
});

// Strava authorization redirect
app.get("/auth", (req, res) => {
  const scope = encodeURIComponent('read,activity:read_all');
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${REDIRECT_URI}&approval_prompt=force&scope=${scope}`;
  res.redirect(authUrl);
});


// Token exchange route
app.get("/exchange_token", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send("No code provided");

  try {
    const response = await axios.post(
      "https://www.strava.com/oauth/token",
      {
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
        grant_type: "authorization_code",
      }
    ); 
    await saveToGoogleSheet(Response.data);


    const { access_token } = response.data;
    res.send(`✅ Connected to Strava! Access token: ${access_token.substring(0, 10)}...`);
  } catch (error) {
    res.status(500).send("Error exchanging token");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
