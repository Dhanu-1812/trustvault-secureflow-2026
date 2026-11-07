const request = require("supertest");
const app = require("../src/app");
const pool = require("../src/config/db");

describe("TrustVault security tests", () => {
  let ownerToken;
  let viewerToken;
  let viewerId;
  let documentId;

  beforeAll(async () => {
    const ownerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "owner1@example.com",
        password: "TestPass@123",
      });

    ownerToken = ownerLogin.body.token;

    const viewerLogin = await request(app)
      .post("/api/auth/login")
      .send({
        email: "viewer1@example.com",
        password: "ViewerPass@123",
      });

    viewerToken = viewerLogin.body.token;
    viewerId = viewerLogin.body.user.id;

    const documentsResponse = await request(app)
      .get("/api/documents")
      .set("Authorization", `Bearer ${ownerToken}`);

    if (!documentsResponse.body.documents?.length) {
      throw new Error(
        "Owner must have at least one uploaded document before running security tests"
      );
    }

    documentId = documentsResponse.body.documents[0].id;
  });
test("viewer cannot delete owner's document", async () => {
  const response = await request(app)
    .delete(`/api/documents/${documentId}`)
    .set("Authorization", `Bearer ${viewerToken}`);

  expect(response.statusCode).toBe(404);
  expect(response.body.message).toBe("Document not found");
});
test("revoked viewer cannot discover document through search", async () => {
  const response = await request(app)
    .get("/api/documents/search?q=")
    .set("Authorization", `Bearer ${viewerToken}`);

  expect(response.statusCode).toBe(200);

  const leakedDocument = response.body.documents.find(
    (document) => document.id === documentId
  );

  expect(leakedDocument).toBeUndefined();
});
test("viewer cannot grant access to owner's document", async () => {
  const response = await request(app)
    .post(`/api/permissions/${documentId}/grant`)
    .set("Authorization", `Bearer ${viewerToken}`)
    .send({
      userId: "00000000-0000-0000-0000-000000000001",
      permission: "READ",
    });

  expect(response.statusCode).toBe(403);
});
  afterAll(async () => {
    await pool.end();
  });

  test("GET /api/auth/me rejects requests without a token", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
      message: "Authentication required",
    });
  });

  test("revoked viewer cannot directly download the document", async () => {
    const grantResponse = await request(app)
      .post(`/api/permissions/${documentId}/grant`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({
        userId: viewerId,
        permission: "READ",
      });

    expect(grantResponse.statusCode).toBe(201);

    const allowedDownload = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(allowedDownload.statusCode).toBe(200);

    const revokeResponse = await request(app)
      .delete(`/api/permissions/${documentId}/revoke/${viewerId}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(revokeResponse.statusCode).toBe(200);

    const blockedDownload = await request(app)
      .get(`/api/documents/${documentId}/download`)
      .set("Authorization", `Bearer ${viewerToken}`);

    expect(blockedDownload.statusCode).toBe(404);

    expect(blockedDownload.body).toEqual({
      message: "Document not found",
    });
  });
});