import { useState } from "react";
import { apiRequest, API_URL } from "./api";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
const [selectedFile, setSelectedFile] = useState(null);
const [category, setCategory] = useState("");
const [uploading, setUploading] = useState(false);
  const handleLogin = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      const data = await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem("token", data.token);

      const currentUser = await apiRequest("/api/auth/me");
      const documentData = await apiRequest("/api/documents");

      setUser(currentUser.user);
      setDocuments(documentData.documents || []);
    } catch (error) {
      setMessage(error.message);
    }
  };
const handleUpload = async (event) => {
  event.preventDefault();

  if (!selectedFile) {
    setMessage("Please select a file");
    return;
  }

  try {
    setUploading(true);
    setMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("category", category);

    await apiRequest("/api/documents/upload", {
      method: "POST",
      body: formData,
    });

    const documentData = await apiRequest("/api/documents");
    setDocuments(documentData.documents || []);

    setSelectedFile(null);
    setCategory("");
    setMessage("Document uploaded successfully");
  } catch (error) {
    setMessage(error.message);
  } finally {
    setUploading(false);
  }
};
const handleSearch = async (event) => {
  event.preventDefault();

  try {
    setMessage("");

    const data = await apiRequest(
      `/api/documents/search?q=${encodeURIComponent(searchQuery)}`
    );

    setDocuments(data.documents || []);
  } catch (error) {
    setMessage(error.message);
  }
};
  const handleDownload = async (doc) => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${API_URL}/api/documents/${doc.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = window.document.createElement("a");
      link.href = url;
      link.download = doc.name;

      window.document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      setMessage(error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setDocuments([]);
    setMessage("");
  };

  if (user) {
    return (
      <div className="app">
        <div className="login-card">
          <h1>TrustVault SecureFlow</h1>

          <h2>Welcome, {user.name}</h2>

          <p>Email: {user.email}</p>
          <p>Role: {user.role}</p>
{user.role === "OWNER" && (
  <form onSubmit={handleUpload}>
    <h3>Upload Document</h3>

    <input
      type="file"
      accept=".pdf,.png,.jpg,.jpeg"
      onChange={(event) => setSelectedFile(event.target.files[0])}
      required
    />

    <input
      type="text"
      placeholder="Category"
      value={category}
      onChange={(event) => setCategory(event.target.value)}
    />

    <button type="submit" disabled={uploading}>
      {uploading ? "Uploading..." : "Upload"}
    </button>
  </form>
)}
<form onSubmit={handleSearch}>
  <input
    type="text"
    placeholder="Search documents..."
    value={searchQuery}
    onChange={(event) => setSearchQuery(event.target.value)}
  />

  <button type="submit">
    Search
  </button>
</form>
          <h3>My Documents</h3>

          {documents.length === 0 ? (
            <p>No accessible documents found.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id}>
                <strong>{doc.name}</strong>

                <p>
                  Category: {doc.category || "Uncategorized"}
                </p>

                <button onClick={() => handleDownload(doc)}>
                  Download
                </button>
              </div>
            ))
          )}

          {message && <p className="message">{message}</p>}

          <button onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="login-card">
        <h1>TrustVault SecureFlow</h1>
        <p>Secure document access platform</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />

          <button type="submit">
            Sign In
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default App;