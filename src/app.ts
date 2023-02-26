import express from "express";

import { getCircuits } from "./routes/circuits";
import routesDrivers from "./routes/drivers";
import routesConsturctors from "./routes/constructors";
import routesPitStop from "./routes/pitstops";
import routesLaps from "./routes/laps";
import routesStandingConstructors from "./routes/standingsConstructors";
import routesStandingDrivers from "./routes/standingsDrivers";
import routesRaceSchedule from "./routes/raceSchedule";
import routesStatus from "./routes/status";
import routesSeason from "./routes/season";
import routesQualifying from "./routes/qualifying";
import routesRaceResults from "./routes/raceResults";
import routesSprintResults from "./routes/sprintResults";

const app = express(); //TODO: make this configurable to limit access to known consumers?

//add Filters
app.get("/circuits", getCircuits);
app.use("/drivers", routesDrivers); //DONE
app.use("/constructors", routesConsturctors); //DONE
app.use("/pitstops", routesPitStop); //DONE
app.use("/laps", routesLaps); //DONE
app.use("/standings/constructors", routesStandingConstructors); //DONE
app.use("/standings/drivers", routesStandingDrivers); //DONE BUT THE PART OF CONSTRUCTORS IS MISSING
app.use("/races", routesRaceSchedule); //DONE
app.use("/status", routesStatus); //DONE
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

export default app;
