const twilio = require('twilio');

const accountSid = 'ACe77a664d7237edd231982acb8e1b42ae'; // Twilio Account SID
const authToken = 'cef6bbe92ce367ad60721de22a245cc7'; // Twilio Auth Token

// Basic Auth configuration for Twilio API
const auth = {
  username: accountSid,
  password: authToken
};

app.post('/send-sms', async (req, res) => {
  const { phoneNumber, message } = req.body;  // Data passed in the request

  try {
    // Making POST request to Twilio API
    const response = await axios.post(
      'https://api.twilio.com/2010-04-01/Accounts/ACe77a664d7237edd231982acb8e1b42ae/Messages.json',
      new URLSearchParams({
        'To': phoneNumber,   // Recipient's phone number
        'From': '+18644771305',  // Your Twilio phone number
        'Body': message  // Message body (e.g., OTP, alerts)
      }),
      {
        auth: auth,  // Pass auth configuration
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    console.log('Message SID:', response.data.sid);  // Log the Twilio message SID
    res.status(200).json({ success: true, message: 'SMS sent successfully!' });
  } catch (error) {
    console.error('Error sending SMS:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, error: 'Failed to send SMS' });
  }
});

// Starting the server
app.listen(3001, () => {
  console.log('Server running on http://localhost:3001');
});
