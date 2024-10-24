const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const app = express();
const sqlite3 = require("sqlite3").verbose();
const port = 3000;

app.use(cors({
    origin: 'http://localhost:5173'  // Set the frontend origin
}));

// Use body-parser middleware to handle JSON request bodies
app.use(bodyParser.json());

const db = new sqlite3.Database('./UserData.db', (err) => {
    if (err) {
        console.error("Error opening database", err);
    } else {
        console.log("Connected to the SQLite database.");
        
        // Create the users table if it doesn't exist
        db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                age INTEGER NOT NULL,
                phone TEXT NOT NULL UNIQUE,  
                email TEXT NOT NULL,
                password TEXT NOT NULL
            )
        `, (err) => {
            if (err) {
                console.error("Error creating table", err);
            } else {
                console.log("Users table created successfully.");
            }
        });
    }
});

app.post("/signup", (req, res) => {
    const { name, age, phone, email, password } = req.body;

    // Validate that all required fields are provided
    if (!name || !age || !phone || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    // Insert user data into the database
    const query = `
        INSERT INTO users (name, age, phone, email, password)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [name, age, phone, email, password], function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed: users.phone')) {
                return res.status(400).json({ error: "Phone number already exists." });
            }
            return res.status(500).json({ error: "Failed to insert data." });
        }

        // Return success message and user ID
        console.log(this.lastID);
        res.status(200).json({ message: "Signup successful!", userId: this.lastID });
    });
});

// Hardcoded OTP for now
const otpStored = "1234";

// Endpoint to generate OTP
app.post("/OTP/gen", (req, res) => {
    const { phone } = req.body;

    if (!phone) {
        console.log("Invalid phone number");
        return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    // Simulate OTP generation (Here, just hardcoded 1234)
    console.log(`OTP (1234) generated for phone number: ${phone}`);

    // Send a response that OTP has been "generated"
    res.status(200).json({ success: true, message: `OTP sent to ${phone}` });
});

// Endpoint to check OTP
app.post("/OTP/check", (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
    }

    console.log(typeof otp);
    // Check if OTP matches the hardcoded OTP
    if (otp === otpStored) {
        console.log(`OTP verified successfully for phone number: ${phone}`);
        res.status(200).json({ success: true, message: "OTP verified successfully" });
    } else {
        console.log(`OTP verification failed for phone number: ${phone}`);
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});
// Add this to your existing Express server code
app.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = "SELECT id, name FROM users WHERE email = ? AND password = ?";
    db.get(query, [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error." });
        }
        if (row) {
            // User found and password matches
            res.status(200).json({ userId: row.id, username: row.name });
        } else {
            // User not found or password incorrect
            res.status(401).json({ error: "Invalid email or password." });
        }
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
