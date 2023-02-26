import { pool } from "../connection";
import request from "supertest";
import app from "../app";
import { DEFAULT_LIMIT, DEFAULT_OFFSET } from "../consts";

function testLimitQueryParameter(endpoint: string) {
    describe("limit", () => {
        it(`defaults to ${DEFAULT_LIMIT} if 'limit' query parameter is undefined`, async () => {
            const url = `${endpoint}`;

            const response = await request(app).get(url);

            expect(response.body.MRData.CircuitTable.Circuits.length).toBe(DEFAULT_LIMIT);
        });

        // it(`defaults to ${DEFAULT_LIMIT} if 'limit' query parameter is negative`, async () => {
        //     const limit = "-1";
        //     const url = `${endpoint}?limit=${limit}`;

        //     const response = await request(app).get(url);

        //     expect(response.body.MRData.CircuitTable.Circuits.length).toBe(DEFAULT_LIMIT);
        // });

        // it(`defaults to ${DEFAULT_LIMIT} if 'limit' query parameter is not a number`, async () => {
        //     const limit = 'blah';
        //     const url = `${endpoint}?limit=${limit}`;

        //     const response = await request(app).get(url);

        //     expect(response.body.MRData.CircuitTable.Circuits.length).toBe(DEFAULT_LIMIT);
        // });

        it(`returns a number of items equal to limit`, async () => {
            const limit = 10;
            const url = `${endpoint}?limit=${limit}`;

            const response = await request(app).get(url);

            expect(response.body.MRData.CircuitTable.Circuits.length).toBe(limit);
        });
    });
}

function testOffsetQueryParameter(
    endpoint: string,
    transformResponse: (response: request.Response) => any[],
    expectedItems: { "0": any; "1": any }
) {
    describe("offset", () => {
        it(`defaults to ${DEFAULT_OFFSET} if 'offset' query parameter is undefined`, async () => {
            const url = `${endpoint}`;

            const response = await request(app).get(url);

            expect(transformResponse(response)[0]).toEqual(expectedItems[0]);
        });

        // it(`defaults to ${DEFAULT_OFFSET} if 'offset' query parameter is negative`, async () => {
        //     const offset = '-1';
        //     const url = `${endpoint}?offset=${offset}`;

        //     const response = await request(app).get(url);

        //     expect(response.body.MRData.CircuitTable.Circuits[0]).toEqual(expectedItems[0]);
        // });

        // it(`defaults to ${DEFAULT_OFFSET} if 'offset' query parameter is not a number`, async () => {
        //     const offset = 'blah';
        //     const url = `${endpoint}?offset=${offset}`;

        //     const response = await request(app).get(url);

        //     expect(response.body.MRData.CircuitTable.Circuits[0]).toEqual(expectedItems[0]);
        // });

        it(`offsets response by the number provided in the offset query parameter`, async () => {
            const offset = 1;
            const url = `${endpoint}?offset=${offset}`;

            const response = await request(app).get(url);
            expect(response.body.MRData.CircuitTable.Circuits[0]).toEqual(expectedItems[1]);
        });
    });
}

function testSqlQueryParameter(endpoint: string, expectedSqlQuery: string) {
    describe("sql", () => {
        it(`returns json if 'sql' query parameter is undefined`, async () => {
            const url = `${endpoint}`;

            const response = await request(app).get(url);

            expect(response.body).toBeDefined();
        });

        it(`returns json if 'sql' query parameter is not 'true'`, async () => {
            const url = `${endpoint}?sql=blah`;

            const response = await request(app).get(url);

            expect(response.body).toBeDefined();
        });

        it(`returns sql query if 'sql' query parameter is 'true'`, async () => {
            const url = `${endpoint}?sql=true`;

            const response = await request(app).get(url);

            expect(response.text).toBe(expectedSqlQuery);
        });
    });
}

describe("GET /circuits", () => {
    const endpoint = "/circuits";

    afterAll(async () => {
        pool.end();
    });

    it("returns 200", async () => {
        const url = `${endpoint}`;
        const response = await request(app).get(url);

        expect(response.statusCode).toBe(200);
    });

    it("returns an array of circuits", async () => {
        const limit = 2;
        const url = `${endpoint}?limit=${limit}`;

        const response = await request(app).get(url);

        expect(response.body.MRData.CircuitTable.Circuits).toEqual([
            {
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            },
            {
                Location: {
                    alt: "19",
                    country: "Morocco",
                    lat: "33.5786",
                    locality: "Casablanca",
                    long: "-7.6875",
                },
                circuitId: "ain-diab",
                circuitName: "Ain Diab",
                url: "http://en.wikipedia.org/wiki/Ain-Diab_Circuit",
            },
        ]);
    });

    testLimitQueryParameter(endpoint);

    testOffsetQueryParameter(endpoint, (response) => response.body.MRData.CircuitTable.Circuits, {
        "0": {
            Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
            circuitId: "adelaide",
            circuitName: "Adelaide Street Circuit",
            url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
        },
        "1": {
            Location: {
                alt: "19",
                country: "Morocco",
                lat: "33.5786",
                locality: "Casablanca",
                long: "-7.6875",
            },
            circuitId: "ain-diab",
            circuitName: "Ain Diab",
            url: "http://en.wikipedia.org/wiki/Ain-Diab_Circuit",
        },
    });

    testSqlQueryParameter(
        endpoint,
        "SELECT DISTINCT circuits.circuitRef, circuits.name, circuits.location, circuits.country, circuits.lat, circuits.lng, circuits.alt, circuits.url FROM circuits WHERE TRUE ORDER BY circuits.circuitRef LIMIT 0, 30"
    );

    describe("driverStandings", () => {
        it(`does not support 'driverStandings' query parameter`, async () => {
            const url = `${endpoint}?driverStandings=true`;
            const response = await request(app).get(url);

            expect(response.statusCode).toBe(400);
        });
    });

    describe("constructorStandings", () => {
        it(`does not support 'constructorStandings' query parameter`, async () => {
            const url = `${endpoint}?constructorStandings=true`;
            const response = await request(app).get(url);

            expect(response.statusCode).toBe(400);
        });
    });
});
