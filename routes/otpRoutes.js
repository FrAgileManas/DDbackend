const express = require("express");
const router = express.Router();
const {sendOTP}=require("./sendSMS");
let otpStore = {}; // Object to store OTPs for each phone number

// Generate OTP route
router.post("/gen", (req, res) => {
    const { phone } = req.body;
  
    if (!phone) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }
  
    // Simulate OTP generation
    const otpGenerated = Math.floor(1000 + Math.random() * 9000); // Generate 4-digit OTP
    otpStore[phone] = otpGenerated; // Store OTP for this phone number
    console.log(`OTP ${otpGenerated} generated for phone number: ${phone}`);
  
    // Call sendOTP function to send the generated OTP
    sendOTP(phone, otpGenerated)
      .then(() => {
        res.status(200).json({ success: true, message: `OTP sent to ${phone}` });
      })
      .catch(error => {
        console.error('Error sending OTP:', error);
        res.status(500).json({ success: false, message: 'Failed to send OTP' });
      });
  
    // Alternatively, you could send a generic success message without relying on sendOTP's promise resolution:
    // res.status(200).json({ success: true, message: `OTP sent to ${phone}` });
  });
  

// Check OTP route
router.post("/check", (req, res) => {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
        return res.status(400).json({ success: false, message: "Phone number and OTP are required" });
    }

    const storedOtp = otpStore[phone]; // Get OTP for this phone number
    if (storedOtp && parseInt(otp) === storedOtp) {
        console.log(`OTP verified successfully for phone number: ${phone}`);
        res.status(200).json({ success: true, message: "OTP verified successfully" });

        // Optionally, remove the OTP after successful verification to prevent reuse
        delete otpStore[phone];
    } else {
        console.log(`OTP verification failed for phone number: ${phone}`);
        res.status(400).json({ success: false, message: "Invalid OTP" });
    }
});

module.exports = router;
