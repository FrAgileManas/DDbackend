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

    async function sendSMS(body, phoneNumber){
   
        
    try {
        const response = await axios.post(
            'https://api.twilio.com/2010-04-01/Accounts/ACe77a664d7237edd231982acb8e1b42ae/Messages.json',
            new URLSearchParams({
                'To': "+91"+phoneNumber,
                'From': '+18644771305',  // Your Twilio phone number
                'Body': `Urgent: Blood Donation Needed!

        Hi ${body.donorName}, we have an urgent request for blood donation in your area!
        
        Blood Type Needed: ${body.bloodType}
        Location: ${body.location}
        Patient in Need: ${body.patientDescription}
        
        If you can help, please respond ASAP by clicking on the following link. Your donation can save a life!
        https://wa.me/+91${body.contact}?text=Hi%20there!%20${body.donorName}%20this%20side.%20I%20am%20a%20donor%20registered%20in%20DonorDash%20and%20match%20your%20requirements
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

async function sendOTP(phoneNumber, otp) {
    const messageBody = `Your OTP is: ${otp}`;
  
    try {
      const response = await axios.post(
        'https://api.twilio.com/2010-04-01/Accounts/ACe77a664d7237edd231982acb8e1b42ae/Messages.json',
        new URLSearchParams({
          'To': "+91"+phoneNumber,
          'From': '+18644771305',  // Your Twilio phone number
          'Body': messageBody
        }),
        {
          auth: auth,
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        }
      );
      console.log('OTP sent successfully. Message SID:', response.data.sid);
    } catch (error) {
      console.error('Error sending OTP:', error.response ? error.response.data : error.message);
    }
  }
  
  module.exports = { sendSMS, sendOTP };
