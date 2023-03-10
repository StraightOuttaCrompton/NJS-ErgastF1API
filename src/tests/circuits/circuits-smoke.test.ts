import request from "supertest";
import app from "../../app";
import querystring from "querystring";
import { pool } from "../../connection";

// import alonsoMclaren from "./expectedData/alonso-mclaren.json";
// import vettelWinsFerrari from "./expectedData/vettel-wins-ferrari.json";

describe("circuit smoke tests", () => {
    const endpoint = "/circuits";

    afterAll(async () => {
        pool.end();
    });

    test("all", async () => {
        const url = `${endpoint}`;

        const response = await request(app).get(url);

        expect(response.body).toMatchSnapshot();
    });

    test("bottas", async () => {
        const url = `${endpoint}?${querystring.stringify({
            driver: "bottas",
        })}`;

        const response = await request(app).get(url);

        expect(response.body).toMatchSnapshot();
    });

    // test.only("alonso-mclaren", async () => {
    //     const url = `${endpoint}?${querystring.stringify({
    //         driver: "alonso",
    //         constructor: "mclaren",
    //     })}`;

    //     const response = await request(app).get(url);

    //     expect(response.body).toEqual(alonsoMclaren);
    // });

    test("hamilton-2020", async () => {
        const url = `${endpoint}?${querystring.stringify({
            driver: "hamilton",
            year: 2022,
        })}`;

        const response = await request(app).get(url);

        expect(response.body).toMatchSnapshot();
    });

    test("maldonado-collision", async () => {
        const url = `${endpoint}?${querystring.stringify({
            driver: "maldonado",
            status: 4,
        })}`;

        const response = await request(app).get(url);

        expect(response.body).toMatchSnapshot();
    });

    // test("vettel-wins-ferrari", async () => {
    //     const url = `${endpoint}?${querystring.stringify({
    //         driver: "vettel",
    //         constructor: "ferrari",
    //         result: 1,
    //     })}`;

    //     const response = await request(app).get(url);

    //     expect(response.body).toEqual(vettelWinsFerrari);
    // });
});
