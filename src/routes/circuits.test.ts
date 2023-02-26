import { pool } from "../connection";
import request from "supertest";
import app from "../app";

describe("GET /circuits", () => {
    const endpoint = "/circuits";

    afterAll(async () => {
        pool.end();
    });

    it("should return 200", async () => {
        const response = await request(app).get(endpoint);

        expect(response.statusCode).toBe(200);
    });
});
