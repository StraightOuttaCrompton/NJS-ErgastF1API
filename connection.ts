import mysql from "mysql";

const pool = mysql.createPool({
    connectionLimit: 20,
    host: "mysql-server",
    port: 3306,
    user: "root",
    password: "f1",
    database: "ergastdb",
});

export function getMySQLConnection() {
    return pool;
}

export function defaultLimit() {
    return 30;
}
