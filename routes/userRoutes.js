const express = require("express");
const router = express.Router();
const db = require('../db'); // Database connection
const { sendEmail } = require('./sendEmail'); 
const { sendSMS } = require("./sendSMS");
console.log("sendEmail:", sendEmail);
// Signup route
router.post("/signup", (req, res) => {
    const { name, age, phone, email, password } = req.body;

    if (!name || !age || !phone || !email || !password) {
        return res.status(400).json({ error: "All fields are required." });
    }

    const query = `
        INSERT INTO users (name, age, phone, email, password)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.run(query, [name, age, phone, email, password], function (err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed: users.phone')) {
                return res.status(400).json({ error: "Phone number already exists." });
            }
            return res.status(500).json({ error: "Failed to insert data." });
        }
        res.status(200).json({ message: "Signup successful!", userId: this.lastID });
    });
});

// Login route
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const query = "SELECT id, name, isDonor FROM users WHERE email = ? AND password = ?";
    db.get(query, [email, password], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error." });
        }
        if (row) {
            res.status(200).json({ userId: row.id, username: row.name, isDonor:row.isDonor });
        } else {
            res.status(401).json({ error: "Invalid email or password." });
        }
    });
});
router.post("/donordb", (req, res) => {
    const { userId, formData } = req.body;

    if (!userId || !formData) {
        return res.status(400).json({ error: "User ID and form data are required." });
    }

    const query = `
        INSERT INTO donors (id, fullName, dateOfBirth, gender, weight, address, pincode, phone, bloodType)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
        userId,
        formData['Full Name (Family name, First name)'],
        formData['Date of Birth'],
        formData['Gender'],
        formData['weight in kg'],
        formData['Residential address'],
        formData['Pin Code'],
        formData['Phone number'],
        formData['Blood Type (if known)']
    ];

    db.run(query, values, function (err) {
        if (err) {
            console.error("Error inserting donor data:", err); // Log the error for debugging
            return res.status(500).json({ error: "Failed to insert donor data." });
        }

        // Update user's isDonor status *after* successful donor data insertion
        db.run(`UPDATE users SET isDonor = 1 WHERE id = ?`, [userId], function(updateErr) {
            if (updateErr) {
                console.error('Error updating donor status:', updateErr); // Log the error
                // Consider a rollback here if the donor data insertion was successful but the update failed.
            } else {
                console.log(`Donor status updated for user with ID ${userId}`);
                res.status(200).json({ message: "Donor data saved successfully!", donorId: this.lastID });
            }
        });
    });
});

router.post('/request', (req, res) => {
    const { requiredBloodGroup, notifyOPositive, city, patientName, patientDescription } = req.body;
    console.log(req.body);

    let bloodGroupQuery = `donors.bloodType = '${requiredBloodGroup}'`;  // Start with the requested blood group

    if (notifyOPositive&& requiredBloodGroup!="O+") { // Only append OR condition if notifyOPositive is true
        bloodGroupQuery = `donors.bloodType = '${requiredBloodGroup}' OR donors.bloodType = 'O+'`;
    }


    const query = `
        SELECT *
        FROM users
        INNER JOIN donors ON users.id = donors.id
        WHERE (${bloodGroupQuery}) AND donors.pincode = ?
    `;  // Using parameterized query


    db.all(query, [city], (err, rows) => {  // Use parameterized query for city
        if (err) {
            console.error('Error executing the query:', err);
            return res.status(500).json({ error: 'Failed to fetch matching users.' });
        }

        if (rows.length > 0) {
            rows.forEach(row => { // Use forEach to iterate over rows
                sendEmail({
                    donorName: row.name,
                    bloodType: requiredBloodGroup, // Send the *requested* blood group in email
                    location: city,
                    patientDescription: patientDescription
                }, row.email);
                // sendSMS({
                //     donorName: row.name,
                //     bloodType: requiredBloodGroup, // Send the *requested* blood group in email
                //     location: city,
                //     patientDescription: patientDescription
                // }, row.phone);
            });

        return res.status(200).json({ message: 'Matching users found', users: rows });
        
    
    } else {
        return res.status(200).json({ message: 'No matching users found' });
      }
    });
    
});


module.exports = router;
