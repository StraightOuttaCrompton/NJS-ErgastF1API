import cors from "cors";
import morgan from "morgan";

import { API_PORT } from "./consts";
import app from "./app";

app.use(morgan("dev"));
app.use(cors());

app.listen(API_PORT, () => {
    console.log(`Server is listening on port ${API_PORT}`);
});
