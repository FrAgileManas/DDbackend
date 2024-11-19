const { EmailClient } = require("@azure/communication-email");
require('dotenv').config();
const connectionString = process.env['COMMUNICATION_SERVICES_CONNECTION_STRING'];
const client = new EmailClient(connectionString);


async function sendEmail(body,add) {
    const emailMessage = {
        senderAddress: "DoNotReply@2ddc102a-1b8b-4eac-a036-97d5acf3e966.azurecomm.net",
        content: {
            subject: "Donor Request From DonorDash",
            plainText: "Hello world via email.",
            html: `
            <html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blood Donation Request</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        h2 {
            color: #d9534f;
        }
        p {
            font-size: 16px;
            color: #333333;
            line-height: 1.5;
        }
        .btn {
            display: inline-block;
            padding: 10px 20px;
            margin-top: 20px;
            background-color: #5cb85c;
            color: white;
            text-decoration: none;
            font-size: 16px;
            border-radius: 5px;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #777777;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <h2>Urgent: Blood Donation Needed!</h2>
        <p>Dear <strong>${body.donorName}</strong>,</p>
        <p>We hope you're doing well. We have an urgent request for blood donation in your area, and you are a perfect match to help save a life!</p>
        <p><strong>Blood Type Needed:</strong> ${body.bloodType}</p>
        <p><strong>Location:</strong> ${body.location}</p>
        <p><strong>Patient's Distress:</strong> ${body.patientDescription}</p>
        <p>If you are available and willing to donate, please RSVP as soon as possible by clicking the link below. Your contribution could make all the difference for someone in critical need.</p>
        <a href="https://wa.me/+91${body.contact}?text=Hi%20there!%20${body.donorName}%20this%20side.%20I%20am%20a%20donor%20registered%20in%20DonorDash%20and%20match%20your%20requirements" class="btn">RSVP Now</a>
        <p>Once you confirm your availability, we will provide you with further details to coordinate the donation.</p>
        <p>Thank you for being a hero and making a positive impact in someone's life today. Every donation counts, and your generosity is truly appreciated.</p>
        <p>Warm regards,</p>
        <p>The DonorDash Team</p>
    </div>
    <div class="footer">
        <p>&copy; 2024 DonorDash. All rights reserved.</p>
    </div>
</body>
</html>
			`,
        },
        recipients: {
            to: [{ address: `${add}`},
            ],
        },
        
    };

    const poller = await client.beginSend(emailMessage);
    const result = await poller.pollUntilDone();
    return result;
}
module.exports = {sendEmail};



