import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export default function App() {
  const fileRef = useRef(null);

  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  const [file, setFile] = useState(null);
  const [syllabusId, setSyllabusId] = useState("");
  const [heading, setHeading] = useState("Introduction");
  const [minutes, setMinutes] = useState(60);

  const [uploading, setUploading] = useState(false);
  const [asking, setAsking] = useState(false);

  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const canAsk = useMemo(
    () => Boolean(syllabusId && heading.trim() && Number(minutes) >= 10),
    [syllabusId, heading, minutes]
  );

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  async function uploadPdf() {
    setError("");
    setAnswer("");

    if (!file) return setError("Please choose a PDF file first.");

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", file); // MUST be "file"
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setSyllabusId(res.data.syllabus_id);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function askHeading() {
    setError("");
    setAnswer("");

    if (!syllabusId) return setError("Upload a PDF first.");
    if (!heading.trim()) return setError("Please type a heading/topic.");

    try {
      setAsking(true);
      const res = await axios.post(`${API_BASE}/chat`, {
        syllabus_id: syllabusId,
        heading,
        minutes: Number(minutes),
      });
      setAnswer(res.data.answer);
    } catch (e) {
      setError(e?.response?.data?.detail || e.message || "Chat failed");
    } finally {
      setAsking(false);
    }
  }

  function resetAll() {
    setFile(null);
    setSyllabusId("");
    setHeading("Introduction");
    setMinutes(60);
    setAnswer("");
    setError("");
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div className="page">
      <div className="overlay" aria-hidden="true" />

      <header className="header fadeInDown">
        <div className="brand">
          <div className="logo">R</div>
          <div className="brandText">
            <h1>RAG Student Coach</h1>
            <p>Upload syllabus PDF → ask heading → get a study plan</p>
          </div>
        </div>

        <div className="headerActions">
          <button className="chip" onClick={toggleTheme} type="button" title="Toggle theme">
            {theme === "dark" ? "🌙 Dark" : "☀️ Light"}
          </button>

          <a className="chip" href={`${API_BASE}/docs`} target="_blank" rel="noreferrer">
            Backend Docs
          </a>

          <button className="btn ghost" onClick={resetAll} type="button">
            Reset
          </button>
        </div>
      </header>

      <main className="wrap">
        <section className="grid fadeInUp">
          {/* LEFT: Upload */}
          <div className="card">
            <div className="cardTop">
              <h2>1) Upload Syllabus</h2>
              <span className="pill">PDF</span>
            </div>

            <div className="field">
              <label className="label">Syllabus PDF</label>

              <input
                ref={fileRef}
                className="fileHidden"
                id="pdf"
                type="file"
                accept="application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />

              <div className="fileRow">
                <label className="btn fileBtn" htmlFor="pdf">
                  Choose PDF
                </label>

                <div className="fileMeta">
                  <div className="fileName">{file ? file.name : "No file selected"}</div>
                  <div className="fileHint">Tip: use a syllabus / module outline</div>
                </div>
              </div>
            </div>

            <button className="btn primary" onClick={uploadPdf} disabled={uploading}>
              {uploading ? (
                <span className="btnLoad">
                  <span className="spinner" /> Uploading...
                </span>
              ) : (
                "Upload & Create Syllabus ID"
              )}
            </button>

            {syllabusId && (
              <div className="success popIn">
                <div className="successLine">
                  <span className="check">✓</span>
                  <div>
                    <div className="successTitle">Uploaded successfully</div>
                    <div className="muted">
                      syllabus_id: <code>{syllabusId}</code>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && <div className="alert popIn">❌ {error}</div>}
          </div>

          {/* RIGHT: Ask */}
          <div className="card">
            <div className="cardTop">
              <h2>2) Ask by Heading</h2>
              <span className="pill">RAG</span>
            </div>

            <div className="field">
              <label className="label">Heading / Topic</label>
              <input
                className="input"
                value={heading}
                onChange={(e) => setHeading(e.target.value)}
                placeholder="Arrays, Functions, Module 1..."
              />
            </div>

            <div className="row">
              <div className="field">
                <label className="label">Minutes</label>
                <input
                  className="input"
                  type="number"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  min={10}
                  max={240}
                />
              </div>
            </div>

            <button className="btn primary" onClick={askHeading} disabled={asking || !canAsk}>
              {asking ? (
                <span className="btnLoad">
                  <span className="spinner" /> Thinking...
                </span>
              ) : (
                "Generate Study Plan"
              )}
            </button>

            {/* Skeleton while thinking */}
            {asking && (
              <div className="result popIn">
                <div className="resultTop">
                  <span className="spark">🧠</span>
                  <h3>Generating plan...</h3>
                </div>
                <div className="skeleton">
                  <div className="skLine w80" />
                  <div className="skLine w95" />
                  <div className="skLine w70" />
                  <div className="skLine w90" />
                  <div className="skLine w60" />
                  <div className="skLine w85" />
                </div>
              </div>
            )}

            {/* Result */}
            {!asking && answer && (
              <div className="result popIn">
                <div className="resultTop">
                  <span className="spark">✨</span>
                  <h3>Your Study Plan</h3>
                </div>
                <pre className="pre">{answer}</pre>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Credit fixed bottom center */}
      <footer className="credit">
        Made by <span>Atheek Fareez</span>
      </footer>
    </div>
  );
}
