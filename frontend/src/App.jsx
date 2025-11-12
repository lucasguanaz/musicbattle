import React, { useState, useEffect } from "react";

function App() {
  // 🔧 URL fixa do backend hospedado no Render
  const API_BASE = "https://musicbattle.onrender.com";

  const [token, setToken] = useState("");
  const [tracks, setTracks] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔑 Recupera token da URL (depois do login)
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const tokenFromUrl = query.get("access_token");
    const storedToken = window.localStorage.getItem("spotify_token");

    if (!storedToken && tokenFromUrl) {
      window.localStorage.setItem("spotify_token", tokenFromUrl);
      setToken(tokenFromUrl);
      // limpa o access_token da URL
      window.history.replaceState({}, document.title, "/");
    } else if (storedToken) {
      setToken(storedToken);
    }
  }, []);

  // 🚪 Login no Spotify
  const handleLogin = () => {
    window.location.href = `${API_BASE}/auth/login`;
  };

  // 🚫 Logout
  const handleLogout = () => {
    setToken("");
    window.localStorage.removeItem("spotify_token");
  };

  // 🎵 Criar torneio de músicas
  const createBattle = async () => {
    if (!playlistUrl.trim()) {
      alert("Cole o link de uma playlist do Spotify.");
      return;
    }

    const playlistId = playlistUrl.split("/playlist/")[1]?.split("?")[0];
    if (!playlistId) {
      alert("URL de playlist inválida.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/playlist/${playlistId}`);
      const data = await res.json();

      if (!data.tracks || data.tracks.length < 2) {
        alert("A playlist precisa ter pelo menos 2 faixas válidas.");
      } else {
        setTracks(data.tracks);
      }
    } catch (err) {
      console.error(err);
      alert("Erro ao buscar playlist. Verifique o link e tente novamente.");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#000",
        color: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Arial, sans-serif",
        padding: "20px",
      }}
    >
      <h1 style={{ color: "#1DB954", marginBottom: "20px" }}>🎵 MUSIC BATTLE</h1>

      {!token ? (
        <button
          onClick={handleLogin}
          style={{
            padding: "12px 24px",
            backgroundColor: "#1DB954",
            border: "none",
            borderRadius: "25px",
            color: "#fff",
            fontSize: "16px",
            cursor: "pointer",
          }}
        >
          Entrar com Spotify (Premium necessário)
        </button>
      ) : (
        <>
          <button
            onClick={handleLogout}
            style={{
              position: "absolute",
              top: "20px",
              right: "20px",
              backgroundColor: "#e74c3c",
              border: "none",
              borderRadius: "10px",
              padding: "8px 16px",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Sair
          </button>

          <div style={{ textAlign: "center", marginTop: "40px" }}>
            <input
              type="text"
              placeholder="Cole o link da playlist do Spotify"
              value={playlistUrl}
              onChange={(e) => setPlaylistUrl(e.target.value)}
              style={{
                width: "300px",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid #333",
                background: "#111",
                color: "#fff",
              }}
            />
            <button
              onClick={createBattle}
              disabled={loading}
              style={{
                marginLeft: "10px",
                padding: "10px 15px",
                backgroundColor: "#1DB954",
                border: "none",
                borderRadius: "10px",
                color: "#fff",
                cursor: "pointer",
              }}
            >
              {loading ? "Carregando..." : "Criar torneio"}
            </button>
          </div>

          {tracks.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h2>🎧 Músicas encontradas:</h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "20px",
                  marginTop: "20px",
                }}
              >
                {tracks.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      background: "#111",
                      borderRadius: "10px",
                      padding: "10px",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={t.album.images[0].url}
                      alt={t.name}
                      style={{ width: "100%", borderRadius: "8px" }}
                    />
                    <p style={{ fontWeight: "bold", margin: "10px 0 5px" }}>{t.name}</p>
                    <p style={{ fontSize: "14px", color: "#aaa" }}>
                      {t.artists.map((a) => a.name).join(", ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;
