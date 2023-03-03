import { DEFAULT_LIMIT, DEFAULT_OFFSET } from "../consts";
import { getMySQLConnection } from "../connection";
import { Request, Response } from "express";
import path from "path";
import { circuits, PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

interface Circuit {
    circuitId: string; // TODO: rename to id
    url: string;
    circuitName: string; // TODO: rename to name
    Location: {
        // TODO: rename to location
        lat: string; // TODO: number?
        long: string; // TODO: number?
        alt: string; // TODO: number?
        locality: string;
        country: string;
    };
}

function formatCircuits(rows: circuits[]): Circuit[] {
    return rows.map((row) => ({
        circuitId: row.circuitRef,
        url: row.url,
        circuitName: row.name,
        Location: {
            // TODO: don't default to 0 here
            lat: (row.lat || 0).toString() || "",
            long: (row.lng || 0).toString() || "",
            alt: row.alt != null ? row.alt.toString() : "N/D",
            locality: row.location || "",
            country: row.country || "",
        },
    }));
}

function parseParamAsInt<T = number | undefined>(param: Request["query"][keyof Request["query"]], defaultValue: T) {
    if (typeof param === "string" || typeof param === "number") {
        const paramAsInt = parseInt(param);

        if (isNaN(paramAsInt)) {
            return defaultValue;
        }

        return paramAsInt;
    }

    return defaultValue;
}

function parseParamAsString<T = string | undefined>(param: Request["query"][keyof Request["query"]], defaultValue: T) {
    if (typeof param !== "string") {
        return defaultValue;
    }

    return param;
}

function parseParams(req: Request, res: Response) {
    const {
        offset: offsetParam,
        limit: limitParam,
        year: yearParam,
        round: roundParam,
        constructor: constructorParam,
        driver: driverParam,
        grid: gridParam,
        result: resultParam,
        fastest: fastestParam,
        status: statusParam,
        driverStandings: driverStandingsParam,
        constructorStandings: constructorStandingsParam,
        ...rest
    } = req.query;

    if (Object.entries(rest).length) {
        res.status(400).send("Bad Request: Check the get params").end();
        return;
    }

    const driverStandings = parseParamAsString(driverStandingsParam, undefined);
    const constructorStandings = parseParamAsString(constructorStandingsParam, undefined);
    if (driverStandings || constructorStandings) {
        res.status(400).send("Bad Request: Circuit queries do not support standings qualifiers.").end();
        return;
    }

    const offset = parseParamAsInt(offsetParam, DEFAULT_OFFSET);
    const limit = parseParamAsInt(limitParam, DEFAULT_LIMIT);

    const year: number | undefined = (() => {
        if (yearParam === "current") {
            return new Date().getFullYear();
        }

        return parseParamAsInt(yearParam, undefined);
    })();

    const round = parseParamAsInt(roundParam, undefined);
    const constructor = parseParamAsString(
        // @ts-ignore
        constructorParam,
        undefined
    );
    const driver = parseParamAsString(driverParam, undefined);
    const grid = parseParamAsString(gridParam, undefined);
    const result = parseParamAsString(resultParam, undefined);
    const fastest = parseParamAsString(fastestParam, undefined);
    const status = parseParamAsInt(statusParam, undefined);

    return {
        offset,
        limit,
        year,
        round,
        constructor,
        driver,
        grid,
        result,
        fastest,
        status,
        driverStandings,
        constructorStandings,
    };
}

interface CircuitResponse {
    MRData: {
        limit: string;
        offset: string;
        CircuitTable: {
            circuitId?: string;
            driverId?: string;
            constructorId?: string;
            grid?: string;
            result?: string;
            fastest?: string;
            status?: string;
            season?: string;
            round?: string;
            Circuits: Circuit[];
        };
    };
}

export async function getCircuits(req: Request, res: Response) {
    const params = parseParams(req, res);
    if (!params) {
        return;
    }

    // const sqlQuery = getSqlQuery({
    //     offset,
    //     limit,
    //     year,
    //     round,
    //     constructor,
    //     circuit,
    //     driver,
    //     grid,
    //     result,
    //     fastest,
    //     status,
    // });

    // const mySQLConnection = getMySQLConnection();
    // mySQLConnection.query(
    //     sqlQuery,
    //     (
    //         err,
    //         // TODO: how to type rows?
    //         rows,
    //         fields
    //     ) => {
    //         if (err) {
    //             console.log(
    //                 "Failed to query for " + __filename.slice(__filename.lastIndexOf(path.sep) + 1) + ": " + err
    //             );
    //             res.status(400).send({ error: err.sqlMessage, sql: err.sql }).end();
    //             return;
    //         }

    //         if (returnSqlQuery) {
    //             res.status(200).send(sqlQuery).end();
    //             return;
    //         }

    //         const response = formatResponse(rows, {
    //             offset,
    //             limit,
    //             year,
    //             round,
    //             constructor,
    //             circuit,
    //             driver,
    //             grid,
    //             result,
    //             fastest,
    //             status,
    //         });

    //         res.json(response);
    //     }
    // );

    // let sqlQuery =
    //     "SELECT DISTINCT circuits.circuitRef, circuits.name, circuits.location, circuits.country, circuits.lat, circuits.lng, circuits.alt, circuits.url FROM circuits";
    // if (year || driver || constructor || status || grid || fastest || result) sqlQuery += ", races";
    // if (driver || constructor || status || grid || fastest || result) sqlQuery += ", results";
    // if (driver) sqlQuery += ", drivers";
    // if (constructor) sqlQuery += ", constructors";
    // sqlQuery += " WHERE TRUE";

    // //Set the join
    // if (year || driver || constructor || status || grid || fastest || result)
    //     sqlQuery += " AND races.circuitId=circuits.circuitId";
    // if (circuit) sqlQuery += ` AND circuits.circuitRef='${circuit}'`;
    // if (driver || constructor || status || grid || fastest || result) sqlQuery += " AND results.raceId=races.raceId";
    // if (constructor)
    //     sqlQuery += ` AND results.constructorId=constructors.constructorId AND constructors.constructorRef='${constructor}'`;
    // if (driver) sqlQuery += ` AND results.driverId=drivers.driverId AND drivers.driverRef='${driver}'`;
    // if (status) sqlQuery += ` AND results.statusId='${status}'`;
    // if (grid) sqlQuery += ` AND results.grid='${grid}'`;
    // if (fastest) sqlQuery += ` AND results.rank='${fastest}'`;
    // if (result) sqlQuery += ` AND results.positionText='${result}'`;
    // if (year) sqlQuery += ` AND races.year='${year}'`;
    // if (round) sqlQuery += ` AND races.round='${round}'`;
    // sqlQuery += ` ORDER BY circuits.circuitRef LIMIT ${offset}, ${limit}`;

    const { offset, limit, year, round, constructor, driver, grid, result, fastest, status } = params;

    const circuits = await prisma.circuits.findMany({
        take: limit,
        skip: offset,
        orderBy: {
            circuitRef: "asc",
        },

        where: {
            races: {
                some: {
                    year: year
                        ? {
                              // TODO: allow for multiple years to be queried by passing years array here
                              in: [year],
                          }
                        : undefined,
                    round: round
                        ? {
                              // TODO: allow for multiple rounds to be queried by passing rounds array here
                              in: [round],
                          }
                        : undefined,

                    results: {
                        some: {
                            driver: {
                                driverRef: driver,
                            },
                            statusId: status ? { in: [status] } : undefined,
                        },
                    },

                    constructorResults: {
                        some: {
                            // TODO: why do I need this ignore?
                            // @ts-ignore
                            constructor: {
                                // TODO: allow multiple
                                constructorRef: constructor,
                            },
                        },
                    },
                },
            },
        },
    });

    res.json(formatCircuits(circuits));
}

export async function getCircuit(req: Request, res: Response) {
    const { circuitRef } = req.params;

    if (!circuitRef) {
        res.status(400).send("circuitId not defined");
        return;
    }

    const circuit = await prisma.circuits.findUnique({ where: { circuitRef } });

    if (!circuit) {
        res.status(404).send("No circuit found");
        return;
    }
    res.json(circuit);
}

// interface CircuitDB {
//     circuitRef: string;
//     url: string;
//     name: string;
//     lat: number;
//     lng: number;
//     alt: number;
//     location: string;
//     country: string;
// }

function getSqlQuery({
    offset,
    limit,
    year,
    round,
    constructor,
    circuit,
    driver,
    grid,
    result,
    fastest,
    status,
}: {
    offset: number;
    limit: number;
    year: string | undefined;
    round: string | undefined;
    constructor: string | undefined;
    circuit: string | undefined;
    driver: string | undefined;
    grid: string | undefined;
    result: string | undefined;
    fastest: string | undefined;
    status: string | undefined;
}) {
    let sqlQuery =
        "SELECT DISTINCT circuits.circuitRef, circuits.name, circuits.location, circuits.country, circuits.lat, circuits.lng, circuits.alt, circuits.url FROM circuits";
    if (year || driver || constructor || status || grid || fastest || result) sqlQuery += ", races";
    if (driver || constructor || status || grid || fastest || result) sqlQuery += ", results";
    if (driver) sqlQuery += ", drivers";
    if (constructor) sqlQuery += ", constructors";
    sqlQuery += " WHERE TRUE";

    //Set the join
    if (year || driver || constructor || status || grid || fastest || result)
        sqlQuery += " AND races.circuitId=circuits.circuitId";
    if (circuit) sqlQuery += ` AND circuits.circuitRef='${circuit}'`;
    if (driver || constructor || status || grid || fastest || result) sqlQuery += " AND results.raceId=races.raceId";
    if (constructor)
        sqlQuery += ` AND results.constructorId=constructors.constructorId AND constructors.constructorRef='${constructor}'`;
    if (driver) sqlQuery += ` AND results.driverId=drivers.driverId AND drivers.driverRef='${driver}'`;
    if (status) sqlQuery += ` AND results.statusId='${status}'`;
    if (grid) sqlQuery += ` AND results.grid='${grid}'`;
    if (fastest) sqlQuery += ` AND results.rank='${fastest}'`;
    if (result) sqlQuery += ` AND results.positionText='${result}'`;
    if (year) sqlQuery += ` AND races.year='${year}'`;
    if (round) sqlQuery += ` AND races.round='${round}'`;
    sqlQuery += ` ORDER BY circuits.circuitRef LIMIT ${offset}, ${limit}`;

    return sqlQuery;
}

function formatResponse(
    rows: circuits[],
    {
        offset,
        limit,
        year,
        round,
        constructor,
        circuit,
        driver,
        grid,
        result,
        fastest,
        status,
    }: {
        offset: number;
        limit: number;
        year: string | undefined;
        round: string | undefined;
        constructor: string | undefined;
        circuit: string | undefined;
        driver: string | undefined;
        grid: string | undefined;
        result: string | undefined;
        fastest: string | undefined;
        status: string | undefined;
    }
) {
    const json: CircuitResponse = {
        MRData: {
            limit: limit.toString(),
            offset: offset.toString(),
            CircuitTable: {
                Circuits: formatCircuits(rows),
            },
        },
    };

    if (year) json.MRData.CircuitTable.season = year;
    if (round) json.MRData.CircuitTable.round = round;
    if (constructor) json.MRData.CircuitTable.constructorId = constructor;
    if (circuit) json.MRData.CircuitTable.circuitId = circuit;
    if (driver) json.MRData.CircuitTable.driverId = driver;
    if (grid) json.MRData.CircuitTable.grid = grid;
    if (result) json.MRData.CircuitTable.result = result;
    if (fastest) json.MRData.CircuitTable.fastest = fastest;
    if (status) json.MRData.CircuitTable.status = status;

    return json;
}
