import express from "express";
import cors from "cors";
import morgan from "morgan";

import { API_PORT } from "./consts";

import routesDrivers from "./routes/drivers";
import routesConsturctors from "./routes/constructors";
import routesPitStop from "./routes/pitstops";
import routesLaps from "./routes/laps";
import routesStandingConstructors from "./routes/standingsConstructors";
import routesStandingDrivers from "./routes/standingsDrivers";
import routesRaceSchedule from "./routes/raceSchedule";
import routesStatus from "./routes/status";
import routesCircuit from "./routes/circuits";
import routesSeason from "./routes/season";
import routesQualifying from "./routes/qualifying";
import routesRaceResults from "./routes/raceResults";
import routesSprintResults from "./routes/sprintResults";

const app = express();
app.use(morgan("dev"));
app.use(cors()); //TODO: make this configurable to limit access to known consumers?

//add Filters
app.use("/drivers", routesDrivers); //DONE
app.use("/constructors", routesConsturctors); //DONE
app.use("/pitstops", routesPitStop); //DONE
app.use("/laps", routesLaps); //DONE
app.use("/standings/constructors", routesStandingConstructors); //DONE
app.use("/standings/drivers", routesStandingDrivers); //DONE BUT THE PART OF CONSTRUCTORS IS MISSING
app.use("/races", routesRaceSchedule); //DONE
app.use("/status", routesStatus); //DONE
app.use("/circuits", routesCircuit); //DONE
app.use("/seasons", routesSeason); //DONE
app.use("/qualifying", routesQualifying); //DONE
app.use("/results", routesRaceResults); //DONE
app.use("/results/sprint", routesSprintResults); //DONE

//TODO: add last and next params

app.get("", (req, res) => {
    res.status(200).send("Hi!");
});

app.use(function (req, res, next) {
    res.status(404).send("<h3>Bad Request</h3>");
});

app.listen(API_PORT, () => {
    console.log(`Server is listening on port ${API_PORT}`);
});
