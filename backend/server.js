import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 10000;

// Permitir acesso do frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://musicbattle-eta.vercel.app",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ==================== ROTAS PRINCIPAIS ====================

// Rota inicial
app.get("/", (req, res) => {
  res.send("🎧 API do Music Battle está rodando!");
});

// === LOGIN DO SPOTIFY ===
app.get("/auth/login", (req, res) => {
  const scope =
    "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state";

  const redirect_uri = "https://musicbattle.onrender.com/auth/callback"; // Rota de callback no backend

  const authUrl = new URL("https://accounts.spotify.com/authorize");
  authUrl.searchParams.append("response_type", "code");
  authUrl.searchParams.append("client_id", process.env.SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append("scope", scope);
  authUrl.searchParams.append("redirect_uri", redirect_uri);

  res.redirect(authUrl.toString());
});

// === CALLBACK DO SPOTIFY ===
app.get("/auth/callback", async (req, res) => {
  const code = req.query.code || null;

  if (!code) {
    return res.status(400).send("Missing code parameter.");
  }

  const params = new URLSearchParams();
  params.append("grant_type", "authorization_code");
  params.append("code", code);
  params.append("redirect_uri", "https://musicbattle.onrender.com/auth/callback");
  params.append("client_id", process.env.SPOTIFY_CLIENT_ID);
  params.append("client_secret", process.env.SPOTIFY_CLIENT_SECRET);

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params,
    });

    const data = await response.json();

    if (data.error) {
      console.error("Erro ao trocar o código:", data);
      return res.status(400).json(data);
    }

    // redireciona de volta pro frontend com o access_token
    const redirectUrl = `https://musicbattle-eta.vercel.app/?access_token=${data.access_token}`;
    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("Erro no callback:", err);
    res.status(500).send("Erro interno no callback do Spotify.");
  }
});

// === BUSCAR PLAYLIST ===
app.get("/playlist/:id", async (req, res) => {
  const playlistId = req.params.id;
  const token = process.env.SPOTIFY_TOKEN || ""; // opcional, pode trocar pelo token dinâmico

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/playlists/${playlistId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();

    if (data.error) {
      console.error("Erro ao buscar playlist:", data);
      return res.status(400).json(data);
    }

    // ✅ Agora aceita todas as músicas (mesmo sem preview)
    const tracks = data.tracks.items
      .filter((item) => item.track)
      .map((item) => item.track);

    res.json({ tracks });
  } catch (err) {
    console.error("Erro geral ao buscar playlist:", err);
    res.status(500).send("Erro interno ao buscar playlist.");
  }
});

// === TESTE DE VIDA ===
app.get("/ping", (req, res) => {
  res.send("pong 🎶");
});

// ==================== INICIAR SERVIDOR ====================
app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
  console.log(`🌍 URL pública: https://musicbattle.onrender.com`);
});
