const express = require("express");
const axios = require('axios');


require('dotenv').config();

// Twilio credentials (make sure to secure your authToken properly)
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const auth = {
  username: accountSid,
  password: authToken
};

// Send SMS route

    async function sendSMS(body, phoneNumbers){
   
        
    try {
        const response = await axios.post(
            'https://api.twilio.com/2010-04-01/Accounts/ACe77a664d7237edd231982acb8e1b42ae/Messages.json',
            new URLSearchParams({
                'To': "+918448907475",
                'From': '+18644771305',  // Your Twilio phone number
                'Body': `Urgent: Blood Donation Needed!

        Hi ${body.donorName}, we have an urgent request for blood donation in your area!
        
        Blood Type Needed: ${body.bloodType}
        Location: ${body.location}
        Patient in Need: ${body.patientDescription}
        
        If you can help, please respond ASAP. Your donation can save a life!
        
        Thank you!
        The DonorDash Team`
            }),
            {
                auth: auth,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }
        );
        console.log('Message SID:', response.data.sid);
        
    } catch (error) {
        console.error('Error sending SMS:', error.response ? error.response.data : error.message);
        
    }
}

module.exports = {sendSMS};
