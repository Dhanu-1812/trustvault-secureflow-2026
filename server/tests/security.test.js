const request = require("supertest");
const app = require("../src/app");

describe("TrustVault security tests", () => {
  test("GET /api/auth/me should reject requests without a token", async () => {
    const response = await request(app)
      .get("/api/auth/me");

    expect(response.statusCode).toBe(401);

    expect(response.body).toEqual({
      message: "Authentication required",
    });
  });
});