import { useState } from "react";
import { apiRequest, API_URL } from "./api";
import "./App.css";

function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);
  const [documents, setDocuments] = useState([]);

  const [selectedFile, setSelectedFile] = useState(null);
  const [category, setCategory] = useState("");
  const [uploading, setUploading] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");

  const [shareEmail, setShareEmail] = useState("");
  const [sharePermission, setSharePermission] = useState("READ");
  const [shareDocumentId, setShareDocumentId] = useState("");
const [shareStatus, setShareStatus] = useState("");
  const loadDocuments = async () => {
    const data = await apiRequest("/api/documents");
    setDocuments(data.documents || []);
  };

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

      await loadDocuments();

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

  const handleShare = async (event) => {
    event.preventDefault();
setShareStatus("");
    if (!shareDocumentId || !shareEmail) {
      setMessage("Select a document and enter user email");
      return;
    }

    try {
      setMessage("");

      const lookupData = await apiRequest(
        `/api/users/lookup?email=${encodeURIComponent(shareEmail)}`
      );

      await apiRequest(`/api/permissions/${shareDocumentId}/grant`, {
        method: "POST",
        body: JSON.stringify({
          userId: lookupData.user.id,
          permission: sharePermission,
        }),
      });

      setShareEmail("");
      setSharePermission("READ");
      setShareDocumentId("");
      setShareStatus("Document shared successfully");
    } catch (error) {
      setShareStatus(error.message);
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
                onChange={(event) =>
                  setSelectedFile(event.target.files[0])
                }
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

          {user.role === "OWNER" && (
            <form onSubmit={handleShare}>
              <h3>Share Document</h3>

              <select
                value={shareDocumentId}
                onChange={(event) =>
                  setShareDocumentId(event.target.value)
                }
                required
              >
                <option value="">Select document</option>

                {documents.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name}
                  </option>
                ))}
              </select>

              <input
                type="email"
                placeholder="Viewer email"
                value={shareEmail}
                onChange={(event) => setShareEmail(event.target.value)}
                required
              />

              <select
                value={sharePermission}
                onChange={(event) =>
                  setSharePermission(event.target.value)
                }
              >
                <option value="READ">READ</option>
                <option value="EDIT">EDIT</option>
              </select>

              <button type="submit">Share</button>
              {shareStatus && <p>{shareStatus}</p>}
            </form>
          )}

          <form onSubmit={handleSearch}>
            <h3>Search Documents</h3>

            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            <button type="submit">Search</button>
          </form>

          <h3>My Documents</h3>

          {documents.length === 0 ? (
            <p>No accessible documents found.</p>
          ) : (
            documents.map((doc) => (
              <div key={doc.id}>
                <strong>{doc.name}</strong>
                <p>Category: {doc.category || "Uncategorized"}</p>

                <button onClick={() => handleDownload(doc)}>
                  Download
                </button>
              </div>
            ))
          )}

          {message && <p className="message">{message}</p>}

          <button onClick={handleLogout}>Logout</button>
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

          <button type="submit">Sign In</button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

export default App;