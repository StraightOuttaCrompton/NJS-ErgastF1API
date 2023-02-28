import { DEFAULT_LIMIT, DEFAULT_OFFSET } from "../consts";
import querystring from "querystring";
import request from "supertest";
import app from "../app";

export function testLimitQueryParameter(endpoint: string) {
    describe("limit", () => {
        it(`defaults to ${DEFAULT_LIMIT} if 'limit' query parameter is undefined`, async () => {
            const url = `${endpoint}`;

            const response = await request(app).get(url);

            expect(response.body.MRData.CircuitTable.Circuits.length).toBe(DEFAULT_LIMIT);
        });

        // it(`defaults to ${DEFAULT_LIMIT} if 'limit' query parameter is negative`, async () => {
        // const url = `${endpoint}?${querystring.stringify({
        //     limit: -1,
        // })}`;

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
            const url = `${endpoint}?${querystring.stringify({
                limit,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.MRData.CircuitTable.Circuits.length).toBe(limit);
        });
    });
}

export function testOffsetQueryParameter(
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
        // const url = `${endpoint}?${querystring.stringify({
        //     offset: -1,
        // })}`;
        //     const response = await request(app).get(url);

        //     expect(response.body.MRData.CircuitTable.Circuits[0]).toEqual(expectedItems[0]);
        // });

        // it(`defaults to ${DEFAULT_OFFSET} if 'offset' query parameter is not a number`, async () => {
        // const url = `${endpoint}?${querystring.stringify({
        //     offset: 'blah',
        // })}`;

        //     const response = await request(app).get(url);

        //     expect(response.body.MRData.CircuitTable.Circuits[0]).toEqual(expectedItems[0]);
        // });

        it(`offsets response by the number provided in the offset query parameter`, async () => {
            const url = `${endpoint}?${querystring.stringify({
                offset: 1,
            })}`;

            const response = await request(app).get(url);
            expect(response.body.MRData.CircuitTable.Circuits[0]).toEqual(expectedItems[1]);
        });
    });
}

export function testSqlQueryParameter(endpoint: string, expectedSqlQuery: string) {
    describe("sql", () => {
        it(`returns json if 'sql' query parameter is undefined`, async () => {
            const url = `${endpoint}`;

            const response = await request(app).get(url);

            expect(response.body).toBeDefined();
        });

        it(`returns json if 'sql' query parameter is not 'true'`, async () => {
            const url = `${endpoint}?${querystring.stringify({
                sql: "blah",
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toBeDefined();
        });

        it(`returns sql query if 'sql' query parameter is 'true'`, async () => {
            const url = `${endpoint}?${querystring.stringify({
                sql: true,
            })}`;

            const response = await request(app).get(url);

            expect(response.text).toBe(expectedSqlQuery);
        });
    });
}
