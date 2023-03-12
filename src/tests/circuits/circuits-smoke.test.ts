import request from "supertest";
import app from "../../app";
import querystring from "querystring";
import { pool } from "../../connection";
import { CircuitsQueryParameters } from "routes/circuits";

// import alonsoMclaren from "./expectedData/alonso-mclaren.json";
// import vettelWinsFerrari from "./expectedData/vettel-wins-ferrari.json";

describe("GET /circuits smoke tests", () => {
    const endpoint = "/circuits";

    const queries: Partial<CircuitsQueryParameters>[] = [
        {
            driverId: "bottas",
        },
        {
            driverId: "hamilton",
            year: 2022,
        },
        {
            driverId: "maldonado",
            status: 4,
        },
        {
            driverId: "hamilton",
            result: 2,
            year: 2022,
        },
        {
            driverId: "max_verstappen",
            grid: 1,
            year: 2022,
        },
    ];

    afterAll(async () => {
        pool.end();
    });

    const testCase = (url: string) => {
        test(url, async () => {
            const response = await request(app).get(url);

            expect(response.body).toMatchSnapshot();
        });
    };

    testCase(endpoint);

    queries.forEach((query) => {
        testCase(`${endpoint}?${querystring.stringify(query)}`);
    });

    // test("alonso-mclaren", async () => {
    //     const url = `${endpoint}?${querystring.stringify({
    //         driver: "alonso",
    //         constructor: "mclaren",
    //     })}`;

    //     const response = await request(app).get(url);

    //     expect(response.body).toEqual(alonsoMclaren);
    // });

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
