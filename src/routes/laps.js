import { DEFAULT_LIMIT } from "../consts";
import { getMySQLConnection } from "../connection";

import express from "express";
import path from "path";

const router = express.Router();
router;

//Supported Function
function formattedRaces(rows) {
    return {
        season: rows[0].year.toString(),
        round: rows[0].round.toString(),
        url: rows[0].url,
        raceName: rows[0].name,
        Circuit: {
            circuitId: rows[0].circuitRef,
            url: rows[0].circuitUrl,
            circuitName: rows[0].circuitName,
            Location: {
                lat: rows[0].lat.toString(),
                long: rows[0].lng.toString(),
                alt: rows[0].alt != null ? rows[0].alt.toString() : "N/D",
                locality: rows[0].location,
                country: rows[0].country,
            },
        },
        date: rows[0].date,
        time: rows[0].raceTime + "Z",
        Laps: formattedLaps(rows),
    };
}

function formattedLaps(rows) {
    const Laps = [];
    let currentLap = 0;
    rows.forEach((element) => {
        if (element.lap != currentLap) {
            const t = {
                number: element.lap.toString(),
                Timings: formattedTiming(rows, element.lap),
            };
            Laps.push(t);
            currentLap = element.lap;
        }
    });

    return Laps;
}

function formattedTiming(rows, lap) {
    const timing = [];

    rows.forEach((element) => {
        if (element.lap == lap) {
            const t = {
                driverId: element.driverRef,
                position: element.position.toString(),
                time: element.time,
            };
            timing.push(t);
        }
    });
    return timing;
}

router.get("", (req, res) => {
    const offset = typeof req.query.offset != "undefined" ? parseInt(req.query.offset) : 0;
    const limit = typeof req.query.limit != "undefined" ? parseInt(req.query.limit) : DEFAULT_LIMIT;

    //START
    let year = null;
    let round = null;
    let constructor = null;
    let circuit = null;
    let driver = null;
    let grid = null;
    let result = null;
    let fastest = null;
    let status = null;
    let driverStandings = null;
    let constructorStandings = null;
    let laps = null;

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
                case "laps":
                    laps = req.query[key];
                    break;
                default:
                    res.status(400).send("Bad Request: Check the get params").end();
                    return;
                    break;
            }
        }
    }

    if (driverStandings || constructorStandings) {
        res.status(400).send("Bad Request: Lap time queries do not support standings qualifiers.").end();
        return;
    }
    if (circuit || grid || fastest || result || status || constructor) {
        res.status(400).send("Bad Request: Lap time queries do not support the specified qualifiers.").end();
        return;
    }
    if (!year || !round) {
        res.status(400).send("Bad Request: Lap time queries require a season and round to be specified.").end();
        return;
    }

    let sql = `SELECT races.year, races.round, races.name, DATE_FORMAT(races.date, '%Y-%m-%d') AS 'date', DATE_FORMAT(races.time, '%H:%i:%S') AS 'raceTime', races.url, 
                circuits.*, drivers.driverRef, lapTimes.lap, lapTimes.position, lapTimes.time 
                FROM lapTimes, races, circuits, drivers
                WHERE races.circuitId=circuits.circuitId AND lapTimes.driverId=drivers.driverId AND lapTimes.raceId=races.raceId AND races.year='${year}' AND races.round='${round}'`;

    if (driver) sql += ` AND drivers.driverRef='${driver}'`;
    if (laps) sql += ` AND lapTimes.lap='${laps}'`;
    sql += ` ORDER BY lapTimes.lap, lapTimes.position LIMIT ${offset}, ${limit}`;

    const conn = getMySQLConnection();
    conn.query(sql, (err, rows, fields) => {
        if (err) {
            console.log("Failed to query for " + __filename.slice(__filename.lastIndexOf(path.sep) + 1) + ": " + err);
            res.status(400).send({ error: err.sqlMessage, sql: err.sql }).end();
            return;
        }
        if (req.query.sql == "true") {
            res.status(200).send(sql).end();
            return;
        }

        const json = {
            MRData: {
                limit: limit.toString(),
                offset: offset.toString(),
                RaceTable: {
                    season: year,
                    round: round,
                },
            },
        };

        if (driver) json.MRData.RaceTable.driverId = driver;
        if (laps) json.MRData.RaceTable.lap = laps;
        if (rows.length > 0) json.MRData.RaceTable.Races = [formattedRaces(rows)];
        else json.MRData.RaceTable.Races = [];
        res.json(json);
    });
});
export default router;
