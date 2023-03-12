import { pool } from "../connection";
import request from "supertest";
import app from "../app";
import querystring from "querystring";
import { testLimitQueryParameter, testOffsetQueryParameter, testSqlQueryParameter } from "../tests/utils";

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
        const url = `${endpoint}?${querystring.stringify({
            limit: 2,
        })}`;

        const response = await request(app).get(url);

        expect(response.body).toEqual([
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

    testOffsetQueryParameter(endpoint, (response) => response.body, {
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

    describe("driverStandings", () => {
        it(`does not support 'driverStandings' query parameter`, async () => {
            const url = `${endpoint}?${querystring.stringify({
                driverStandings: true,
            })}`;

            const response = await request(app).get(url);

            expect(response.statusCode).toBe(400);
        });
    });

    describe("constructorStandings", () => {
        it(`does not support 'constructorStandings' query parameter`, async () => {
            const url = `${endpoint}?${querystring.stringify({
                constructorStandings: true,
            })}`;

            const response = await request(app).get(url);

            expect(response.statusCode).toBe(400);
        });
    });

    // TODO: round seems to fuck up
    describe("round", () => {
        it(`does not support 'round' query parameter`, async () => {
            const url = `${endpoint}?${querystring.stringify({
                round: 0,
            })}`;

            const response = await request(app).get(url);

            expect(response.statusCode).toBe(400);
        });
    });

    describe("year", () => {
        it("returns all circuits if year is undefined", async () => {
            const url = `${endpoint}?${querystring.stringify({
                year: undefined,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });

        it("returns no circuits if year is invalid", async () => {
            const url = `${endpoint}?${querystring.stringify({
                year: 1,
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toEqual([]);
        });

        it("returns circuits from correct year", async () => {
            const url = `${endpoint}?${querystring.stringify({
                year: 2022,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(22);
            expect(response.body[0]).toEqual({
                Location: {
                    alt: "10",
                    country: "Australia",
                    lat: "-37.8497",
                    locality: "Melbourne",
                    long: "144.968",
                },
                circuitId: "albert_park",
                circuitName: "Albert Park Grand Prix Circuit",
                url: "http://en.wikipedia.org/wiki/Melbourne_Grand_Prix_Circuit",
            });
        });

        it("returns circuits from current year if year is 'current'", async () => {
            const url = `${endpoint}?${querystring.stringify({
                year: "current",
            })}`;
            const currentYearUrl = `${endpoint}?${querystring.stringify({
                year: new Date().getFullYear(),
            })}`;

            const response = await request(app).get(url);
            const currentYearResponse = await request(app).get(currentYearUrl);

            expect(response.body).toEqual(currentYearResponse.body);
        });
    });

    describe("constructor", () => {
        it("returns all circuits if constructor is undefined", async () => {
            const url = `${endpoint}?${querystring.stringify({
                constructor: undefined,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });

        it("returns no circuits if constructor is invalid", async () => {
            const url = `${endpoint}?${querystring.stringify({
                constructor: "superfastcars",
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toEqual([]);
        });

        it("returns circuits where the constructor has competed", async () => {
            const url = `${endpoint}?${querystring.stringify({
                constructor: "bugatti",
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(1);

            expect(response.body).toEqual([
                {
                    Location: { alt: "88", country: "France", lat: "49.2542", locality: "Reims", long: "3.93083" },
                    circuitId: "reims",
                    circuitName: "Reims-Gueux",
                    url: "http://en.wikipedia.org/wiki/Reims-Gueux",
                },
            ]);
        });
    });

    describe("driver", () => {
        it("returns all circuits if driver is undefined", async () => {
            const url = `${endpoint}?${querystring.stringify({
                driver: undefined,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });

        it("returns no circuits if driver is invalid", async () => {
            const url = `${endpoint}?${querystring.stringify({
                driver: "santaclause",
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toEqual([]);
        });

        it("returns circuits where the driver has competed", async () => {
            const url = `${endpoint}?${querystring.stringify({
                driver: "ader",
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(1);
            expect(response.body).toEqual([
                {
                    circuitId: "indianapolis",
                    url: "http://en.wikipedia.org/wiki/Indianapolis_Motor_Speedway",
                    circuitName: "Indianapolis Motor Speedway",
                    Location: {
                        lat: "39.795",
                        long: "-86.2347",
                        alt: "223",
                        locality: "Indianapolis",
                        country: "USA",
                    },
                },
            ]);
        });
    });

    describe("grid", () => {
        it("returns all circuits if grid is undefined", async () => {
            const url = `${endpoint}?${querystring.stringify({
                grid: undefined,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });

        it("returns no circuits if driver is invalid", async () => {
            const url = `${endpoint}?${querystring.stringify({
                grid: -1,
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toEqual([]);
        });

        it("returns circuits which contains the grid position", async () => {
            const url = `${endpoint}?${querystring.stringify({
                grid: 30,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(7);
            expect(response.body[0]).toEqual({
                Location: { alt: "20", country: "UK", lat: "53.4769", locality: "Liverpool", long: "-2.94056" },
                circuitId: "aintree",
                circuitName: "Aintree",
                url: "http://en.wikipedia.org/wiki/Aintree_Motor_Racing_Circuit",
            });
        });
    });

    describe("result", () => {
        it("returns all circuits if result is undefined", async () => {
            const url = `${endpoint}?${querystring.stringify({
                result: undefined,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });

        it("returns no circuits if result is invalid", async () => {
            const url = `${endpoint}?${querystring.stringify({
                result: -1,
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toEqual([]);
        });

        it("returns circuits which have had the defined result", async () => {
            const url = `${endpoint}?${querystring.stringify({
                result: 30,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(1);
            expect(response.body[0]).toEqual({
                circuitId: "indianapolis",
                url: "http://en.wikipedia.org/wiki/Indianapolis_Motor_Speedway",
                circuitName: "Indianapolis Motor Speedway",
                Location: {
                    lat: "39.795",
                    long: "-86.2347",
                    alt: "223",
                    locality: "Indianapolis",
                    country: "USA",
                },
            });
        });
    });

    // TODO: what does this even mean in this context?
    describe("fastest", () => {
        it("returns all circuits if fastest is undefined", async () => {
            const url = `${endpoint}?${querystring.stringify({
                fastest: undefined,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });

        it("returns no circuits if fastest is invalid", async () => {
            const url = `${endpoint}?${querystring.stringify({
                fastest: -1,
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toEqual([]);
        });

        it("returns circuits which TODO:", async () => {
            const url = `${endpoint}?${querystring.stringify({
                fastest: 24,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(18);
            expect(response.body[0]).toEqual({
                circuitId: "americas",
                url: "http://en.wikipedia.org/wiki/Circuit_of_the_Americas",
                circuitName: "Circuit of the Americas",
                Location: {
                    lat: "30.1328",
                    long: "-97.6411",
                    alt: "161",
                    locality: "Austin",
                    country: "USA",
                },
            });
        });
    });

    // TODO: what does this even mean in this context?
    describe("status", () => {
        it("returns all circuits if status is undefined", async () => {
            const url = `${endpoint}?${querystring.stringify({
                status: undefined,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });

        it("returns no circuits if status is invalid", async () => {
            const url = `${endpoint}?${querystring.stringify({
                status: "invalid",
            })}`;

            const response = await request(app).get(url);

            expect(response.body).toEqual([]);
        });

        it("returns circuits which TODO:", async () => {
            const url = `${endpoint}?${querystring.stringify({
                status: 1,
            })}`;

            const response = await request(app).get(url);

            expect(response.body.length).toBe(30);
            expect(response.body[0]).toEqual({
                Location: { alt: "58", country: "Australia", lat: "-34.9272", locality: "Adelaide", long: "138.617" },
                circuitId: "adelaide",
                circuitName: "Adelaide Street Circuit",
                url: "http://en.wikipedia.org/wiki/Adelaide_Street_Circuit",
            });
        });
    });
});

describe("GET /circuits/{circuitId}", () => {
    const endpoint = "/circuits";

    it("returns no circuits if circuit is invalid", async () => {
        const circuit = "supercooltrack";
        const url = `${endpoint}/${circuit}`;

        const response = await request(app).get(url);

        expect(response.body).toEqual({});
    });

    it("returns 1 circuit when circuit is defined", async () => {
        const circuit = "monza";
        const url = `${endpoint}/${circuit}`;

        const response = await request(app).get(url);

        expect(response.body).toEqual({
            circuitId: "monza",
            url: "http://en.wikipedia.org/wiki/Autodromo_Nazionale_Monza",
            circuitName: "Autodromo Nazionale di Monza",
            Location: { lat: "45.6156", long: "9.28111", alt: "162", locality: "Monza", country: "Italy" },
        });
    });
});
