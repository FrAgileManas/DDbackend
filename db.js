const sqlite3 = require("sqlite3").verbose();

// Open database connection
const db = new sqlite3.Database('./UserData.db', (err) => {
    if (err) {
        console.error("Error opening database", err);
    } else {
        console.log("Connected to the SQLite database.");
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                phone TEXT NOT NULL UNIQUE,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                isDonor INTEGER DEFAULT 0
            )
        `, (err) => {
            if (err) {
                console.error("Error creating table", err);
            } else {
                console.log("Users table created successfully.");
            }
        });
        db.run(`
            CREATE TABLE IF NOT EXISTS donors (
                id INTEGER PRIMARY KEY,
                fullName TEXT,
                dateOfBirth TEXT,
                gender TEXT,
                weight INTEGER,  
                address TEXT,
                pincode TEXT,
                phone TEXT,
                bloodType TEXT,
                FOREIGN KEY (id) REFERENCES users (id)
            )
        `, (err) => {
            if (err) {
                console.error("Error creating donors table", err);
            } else {
                console.log("Donors table created successfully.");
            }
        });
        
        
    }

});

module.exports = db;
