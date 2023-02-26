import mysql from "mysql";

export const pool = mysql.createPool({
    connectionLimit: 20,
    host: process.env.NODE_ENV === "production" ? "mysql-server" : "localhost",
    port: 3306,
    user: "root",
    password: "f1",
    database: "ergastdb",
});

export function getMySQLConnection() {
    return pool;
}
