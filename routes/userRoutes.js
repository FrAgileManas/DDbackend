const express = require("express");
const router = express.Router();
const db = require('../db'); // Database connection
const { sendEmail } = require('./sendEmail'); 
const { sendSMS } = require("./sendSMS");
console.log("sendEmail:", sendEmail);
// Signup routes
router.post("/checkUniqueness", (req, res) => {
    const { phone, email } = req.body;
    if (!phone || !email) {
      return res.status(400).json({ success: false, message: "Phone and Email are required" });
    }
  
    db.get("SELECT * FROM users WHERE phone = ? OR email = ?", [phone, email], (err, row) => {
      if (err) {
        return res.status(500).json({ error: "Database error while checking uniqueness." });
      }
      if (row) {
        return res.status(400).json({
          error: row.phone === phone ? "Phone number already exists." : "Email already exists.",
        });
      }
      res.json({success: true}); // Indicate uniqueness
    });
  });
router.post("/signup", (req, res) => {
    const { name, age, phone, email, password } = req.body;

       const checkQuery = `
        SELECT id FROM users WHERE phone = ? OR email = ?
    `;

    db.get(checkQuery, [phone, email], (err, row) => {
        if (err) {
            return res.status(500).json({ error: "Database error while checking uniqueness." });
        }

        if (row) {
            return res.status(400).json({ 
                error: row.phone === phone 
                    ? "Phone number already exists." 
                    : "Email already exists."
            });
        }

        // Insert new user if phone and email are unique
        const insertQuery = `
            INSERT INTO users (name, age, phone, email, password)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(insertQuery, [name, age, phone, email, password], function (err) {
            if (err) {
                return res.status(500).json({ error: "Failed to insert user." });
            }

            // Return the ID of the newly inserted user
            res.status(200).json({ 
                message: "Signup successful!", 
                userId: this.lastID 
            });
        });
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
        formData['Blood Type']
    ];
    console.log(values)

    db.run(query, values, function (err) {
        if (err) {
            console.error("Error inserting donor data:", err); // Log the error for debugging
            return res.status(500).json({ error: "Failed to insert donor data." });
        }

        // Update user's isDonor status *after* successful donor data insertion
        db.run(`UPDATE users SET isDonor = 1 WHERE id = ?`, [userId], function(updateErr) {
            if (updateErr) {
                console.error('Error updating donor status:', updateErr); // Log the error
            } else {
                console.log(`Donor status updated for user with ID ${userId}`);
                res.status(200).json({ message: "Donor data saved successfully!", donorId: this.lastID });
            }
        });
    });
});

router.delete("/donordb/:userId", (req, res) => {
    const userId = req.params.userId;

    if (!userId) {
        return res.status(400).json({ error: "User ID is required." });
    }

    // Use transactions to ensure atomicity (both operations succeed or fail together)
    db.serialize(() => {
        db.run("BEGIN TRANSACTION"); // Start transaction

        db.run(`DELETE FROM donors WHERE id = ?`, [userId], function(err) {
            if (err) {
                db.run("ROLLBACK"); // Rollback if deletion fails
                console.error("Error deleting donor data:", err);
                return res.status(500).json({ error: "Failed to delete donor data." });
            }

            db.run(`UPDATE users SET isDonor = 0 WHERE id = ?`, [userId], function(updateErr) {
                if (updateErr) {
                    db.run("ROLLBACK"); // Rollback if update fails
                    console.error("Error updating donor status:", updateErr);
                    return res.status(500).json({ error: "Failed to update donor status." });
                }

                db.run("COMMIT"); // Commit transaction if both operations succeed
                console.log(`Donor status updated for user with ID ${userId}`);
                res.status(200).json({ message: "Donor data removed successfully." });
            });
        });
    });
});

router.post('/request', async (req, res) => {
    const { ID, requiredBloodGroup, notifyOPositive, city, patientName, patientDescription } = req.body;
    console.log(req.body);

    try {
        // Fetch contact for the requesting user
        const userQuery = 'SELECT phone FROM users WHERE id = ?';
        const requester = await new Promise((resolve, reject) => {
            db.get(userQuery, ID, (err, row) => {
                if (err) return reject(err);
                if (!row) return reject(new Error(`User with ID ${ID} not found.`));
                resolve(row);
            });
        });

        const contact = requester.phone;

        // Construct the blood group query
        let bloodGroupQuery = 'donors.bloodType = ?';
        const params = [requiredBloodGroup, city];

        if (notifyOPositive && requiredBloodGroup !== 'O+') {
            bloodGroupQuery = '(donors.bloodType = ? OR donors.bloodType = ?)';
            params.unshift('O+');
        }

        // Fetch matching donors
        const donorQuery = `
            SELECT *
            FROM users
            INNER JOIN donors ON users.id = donors.id
            WHERE ${bloodGroupQuery} AND donors.pincode = ?
        `;

        db.all(donorQuery, params, (err, rows) => {
            if (err) {
                console.error('Error executing the query:', err);
                return res.status(500).json({ error: 'Failed to fetch matching users.' });
            }

            if (rows.length > 0) {
                rows.forEach(row => {
                    sendEmail({
                        contact, // Requesting user's contact
                        donorName: row.name,
                        bloodType: requiredBloodGroup, // Requested blood group
                        location: city,
                        patientDescription
                    }, row.email);

                    sendSMS({
                        contact, // Requesting user's contact
                        donorName: row.name,
                        bloodType: requiredBloodGroup, // Requested blood group
                        location: city,
                        patientDescription
                    }, row.phone);
                });

                return res.status(200).json({ message: 'Matching users found', users: rows });
            } else {
                return res.status(200).json({ message: 'No matching users found' });
            }
        });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
    }
});


module.exports = router;
