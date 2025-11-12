import React, { useState, useEffect } from "react";

function App() {
  // 🔧 URL fixa do backend hospedado no Render
  const API_BASE = "https://musicbattle.onrender.com";

  const [token, setToken] = useState("");
  const [tracks, setTracks] = useState([]);
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [loading, setLoading] = useState(false);

  // 🔑 Recupera token do Spotify (se já logou antes)
  useEffect(() => {
    const hash = window.location.hash;
    const storedToken = window.localStorage.getItem("spotify_token");

    if (!storedToken && hash) {
      const tokenFromUrl = new URLSearchParams(hash.replace("#", "?")).get("access_token");
      window.location.hash = "";
      window.localStorage.setItem("spotify_token", tokenFromUrl);
      setToken(tokenFromUrl);
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
