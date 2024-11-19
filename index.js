const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');

// Initialize the app
const app = express();
const port = process.env.PORT || 3000;

app.use(cors({
    origin: "*"
}));
app.use(bodyParser.json());

// Routes
const userRoutes = require('./routes/userRoutes');
const otpRoutes = require('./routes/otpRoutes');
const feed=require('./routes/feed')
const koonie=require('./routes/koonie')
// Use routes
app.use("/user", userRoutes);
app.use("/OTP", otpRoutes);
app.use("/feed",feed)
app.use("/chat",koonie)
app.get("/",(req,res)=>{
    res.send("server runninnggggg....")
});
// Start the server
app.listen(port, () => {
    console.log(`Server running on port:${port}`);
});
