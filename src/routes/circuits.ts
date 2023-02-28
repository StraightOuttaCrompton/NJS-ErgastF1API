import { DEFAULT_LIMIT, DEFAULT_OFFSET } from "../consts";
import { getMySQLConnection } from "../connection";
import { Request, Response } from "express";
import path from "path";

interface CircuitDB {
    circuitRef: string;
    url: string;
    name: string;
    lat: number;
    lng: number;
    alt: number;
    location: string;
    country: string;
}

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

function formatCircuits(rows: CircuitDB[]): Circuit[] {
    return rows.map((row) => ({
        circuitId: row.circuitRef,
        url: row.url,
        circuitName: row.name,
        Location: {
            lat: row.lat.toString(),
            long: row.lng.toString(),
            alt: row.alt != null ? row.alt.toString() : "N/D",
            locality: row.location,
            country: row.country,
        },
    }));
}

function parseParamAsInt(param: Request["query"][keyof Request["query"]], defaultValue: number) {
    if (typeof param === "string" || typeof param === "number") {
        const paramAsInt = parseInt(param);

        if (isNaN(paramAsInt)) {
            return defaultValue;
        }

        return paramAsInt;
    }

    return defaultValue;
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

export function getCircuits(req: Request, res: Response) {
    const { offset: offsetParam, limit: limitParam } = req.query;

    const offset = parseParamAsInt(offsetParam, DEFAULT_OFFSET);
    const limit = parseParamAsInt(limitParam, DEFAULT_LIMIT);

    //START
    let year: any = null;
    let round: any = null;
    let constructor: any = null;
    let circuit: any = null;
    let driver: any = null;
    let grid: any = null;
    let result: any = null;
    let fastest: any = null;
    let status: any = null;
    let driverStandings: any = null;
    let constructorStandings: any = null;

    for (const key in req.query) {
        if (key != "offset" && key != "limit" && key != "sql") {
            switch (key) {
                case "year":
                    req.query[key] == "current"
                        ? (year = new Date().getFullYear().toString())
                        : (year = req.query[key]);
                    break;
                case "round":
                    round = req.query[key];
                    break;
                case "constructor":
                    constructor = req.query[key];
                    break;
                case "circuit":
                    circuit = req.query[key];
                    break;
                case "driver":
                    driver = req.query[key];
                    break;
                case "grid":
                    grid = req.query[key];
                    break;
                case "result":
                    result = req.query[key];
                    break;
                case "fastest":
                    fastest = req.query[key];
                    break;
                case "status":
                    status = req.query[key];
                    break;
                case "driverStandings":
                    driverStandings = req.query[key];
                    break;
                case "constructorStandings":
                    constructorStandings = req.query[key];
                    break;
                default:
                    res.status(400).send("Bad Request: Check the get params").end();
                    return;
                    break;
            }
        }
    }

    if (driverStandings || constructorStandings) {
        res.status(400).send("Bad Request: Circuit queries do not support standings qualifiers.").end();
        return;
    }

    let sql =
        "SELECT DISTINCT circuits.circuitRef, circuits.name, circuits.location, circuits.country, circuits.lat, circuits.lng, circuits.alt, circuits.url FROM circuits";
    if (year || driver || constructor || status || grid || fastest || result) sql += ", races";
    if (driver || constructor || status || grid || fastest || result) sql += ", results";
    if (driver) sql += ", drivers";
    if (constructor) sql += ", constructors";
    sql += " WHERE TRUE";

    //Set the join
    if (year || driver || constructor || status || grid || fastest || result)
        sql += " AND races.circuitId=circuits.circuitId";
    if (circuit) sql += ` AND circuits.circuitRef='${circuit}'`;
    if (driver || constructor || status || grid || fastest || result) sql += " AND results.raceId=races.raceId";
    if (constructor)
        sql += ` AND results.constructorId=constructors.constructorId AND constructors.constructorRef='${constructor}'`;
    if (driver) sql += ` AND results.driverId=drivers.driverId AND drivers.driverRef='${driver}'`;
    if (status) sql += ` AND results.statusId='${status}'`;
    if (grid) sql += ` AND results.grid='${grid}'`;
    if (fastest) sql += ` AND results.rank='${fastest}'`;
    if (result) sql += ` AND results.positionText='${result}'`;
    if (year) sql += ` AND races.year='${year}'`;
    if (round) sql += ` AND races.round='${round}'`;
    sql += ` ORDER BY circuits.circuitRef LIMIT ${offset}, ${limit}`;

    const mySQLConnection = getMySQLConnection();
    mySQLConnection.query(sql, (err, rows, fields) => {
        if (err) {
            console.log("Failed to query for " + __filename.slice(__filename.lastIndexOf(path.sep) + 1) + ": " + err);
            res.status(400).send({ error: err.sqlMessage, sql: err.sql }).end();
            return;
        }
        if (req.query.sql == "true") {
            res.status(200).send(sql).end();
            return;
        }

        const json: CircuitResponse = {
            MRData: {
                limit: limit.toString(),
                offset: offset.toString(),
                CircuitTable: {
                    Circuits: formatCircuits(rows),
                },
            },
        };

        if (circuit) json.MRData.CircuitTable.circuitId = circuit;
        if (driver) json.MRData.CircuitTable.driverId = driver;
        if (constructor) json.MRData.CircuitTable.constructorId = constructor;
        if (grid) json.MRData.CircuitTable.grid = grid;
        if (result) json.MRData.CircuitTable.result = result;
        if (fastest) json.MRData.CircuitTable.fastest = fastest;
        if (status) json.MRData.CircuitTable.status = status;
        if (year) json.MRData.CircuitTable.season = year;
        if (round) json.MRData.CircuitTable.round = round;

        res.json(json);
    });
}
