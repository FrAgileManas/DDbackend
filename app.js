const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');

// Initialize the app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:5173'; // Use environment variable or default

app.use(cors({
    origin: frontendOrigin
}));
app.use(bodyParser.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes');


// Use routes
app.use("/user", userRoutes);
app.use("/OTP", otpRoutes);


// Start the server
app.listen(port, () => {
    console.log(`Server running on port:${port}`);
});
