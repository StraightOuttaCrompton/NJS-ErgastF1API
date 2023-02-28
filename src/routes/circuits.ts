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
        circuit: circuitParam,
        driver: driverParam,
        grid: gridParam,
        result: resultParam,
        fastest: fastestParam,
        status: statusParam,
        driverStandings: driverStandingsParam,
        constructorStandings: constructorStandingsParam,
        sql: sqlParam,
        ...rest
    } = req.query;

    if (Object.entries(rest).length) {
        res.status(400).send("Bad Request: Check the get params").end();
    }

    const offset = parseParamAsInt(offsetParam, DEFAULT_OFFSET);
    const limit = parseParamAsInt(limitParam, DEFAULT_LIMIT);

    const year: string | undefined = (() => {
        if (typeof yearParam !== "string") {
            return undefined;
        }

        if (yearParam === "current") {
            return new Date().getFullYear().toString();
        }
        return yearParam;
    })();

    const round = parseParamAsString(roundParam, undefined);
    const constructor = parseParamAsString(
        // @ts-ignore
        constructorParam,
        undefined
    );
    const circuit = parseParamAsString(circuitParam, undefined);
    const driver = parseParamAsString(driverParam, undefined);
    const grid = parseParamAsString(gridParam, undefined);
    const result = parseParamAsString(resultParam, undefined);
    const fastest = parseParamAsString(fastestParam, undefined);
    const status = parseParamAsString(statusParam, undefined);
    const driverStandings = parseParamAsString(driverStandingsParam, undefined);
    const constructorStandings = parseParamAsString(constructorStandingsParam, undefined);

    return {
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

export function getCircuits(req: Request, res: Response) {
    const {
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
        driverStandings,
        constructorStandings,
    } = parseParams(req, res);

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
        if (sqlParam == "true") {
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
