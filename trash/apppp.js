const express = require('express');
const bodyParser = require('body-parser');
const db = require('./database');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware to parse JSON and form data
app.options('*', cors());  // Allow preflight requests for all routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173'  // Set the frontend origin
  }));
// Endpoint to handle form submissions
app.post('/', (req, res) => {
  const {
    fullName,
    age,
    gender,
    bloodGroup,
    contactNumber,
    emailAddress,
    location,
    preferredLanguage,
    donatedRecently,
    onMedication,
    medications,
    knownConditions,
    conditions,
    allergies,
    allergyList,
    recentSurgery,
    surgeryDetails,
    pregnantOrNursing,
    infectiousDiseases,
    vaccinated,
    donationFrequency,
    emergencyDonations,
    donationMethod,
    travelRestrictions,
    consentContact,
    consentPolicy
  } = req.body;

  // Insert data into the SQLite database
  db.run(`
    INSERT INTO donors (
      fullName, age, gender, bloodGroup, contactNumber, emailAddress, location, 
      preferredLanguage, donatedRecently, onMedication, medications, knownConditions, 
      conditions, allergies, allergyList, recentSurgery, surgeryDetails, pregnantOrNursing, 
      infectiousDiseases, vaccinated, donationFrequency, emergencyDonations, 
      donationMethod, travelRestrictions, consentContact, consentPolicy
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    fullName, age, gender, bloodGroup, contactNumber, emailAddress, location, 
    preferredLanguage, donatedRecently, onMedication, medications, knownConditions, 
    conditions, allergies, allergyList, recentSurgery, surgeryDetails, pregnantOrNursing, 
    infectiousDiseases, vaccinated, donationFrequency, emergencyDonations, 
    donationMethod, travelRestrictions, consentContact, consentPolicy
  ], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    res.status(200).json({ message: 'Data inserted successfully!', id: this.lastID });
  });
});
// Endpoint to get all donors
app.get('/donors', (req, res) => {
    db.all('SELECT * FROM donors', [], (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(200).json({ donors: rows });
    });
  });

  
  app.post('/request', (req, res) => {
    const { patientName, requiredBloodGroup, notifyOPositive, city } = req.body;
  
    console.log('Request Data:', { patientName, requiredBloodGroup, notifyOPositive, city });  // Debugging: log request data

    // Initialize query and parameters
    let query = `SELECT * FROM donors WHERE location = ${city} AND bloodGroup = ${requiredBloodGroup} AND donatedRecently = 0 AND onMedication = 0 AND (knownConditions IS NULL OR knownConditions = '') `;
    
    let params = [city, requiredBloodGroup];

    // If notifyOPositive is true, modify query and include 'O+' as an additional blood group condition
    if (notifyOPositive) {
        query = `
          SELECT * FROM donors
          WHERE location = ?
          AND (bloodGroup = ? OR bloodGroup = 'O+')
          AND donatedRecently = 0  -- Only donors who haven't donated recently
          AND onMedication = 0      -- Only donors not on medication
          AND (knownConditions IS NULL OR knownConditions = '')  -- Only donors without known conditions
        `;
        // Parameters remain the same
    }

    console.log('Executing Query:', query, 'with parameters:', params);  // Debugging: log query and params
    
    // Execute the query with parameters
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error('Database Error:', err);  // Debugging: log any database error
            return res.status(500).json({ error: err.message });
        }

        console.log('Query Result:', rows);  // Debugging: log result rows
        
        if (rows.length > 0) {
            // Donors found that match the criteria
            return res.json({ message: 'Matching donors found!', donors: rows });
        } else {
            // No matching donors found
            return res.json({ message: 'No matching donors found' });
        }
    });
});

  
// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
