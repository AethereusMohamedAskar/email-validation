const express = require('express');
const validator = require('deep-email-validator');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
app.use(bodyParser.json());
global.emails;
const requestid = uuid.v4();
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'mohamedaskar1002@gmail.com',
    pass: 'oqmnhmvxkjzjdcrw'
  },
  socketTimeout: 10000, // Increase the timeout value to 10 seconds
});

app.post('/validate', (req, res) => {
  try {
    if (!req.body || !Array.isArray(req.body.emails)) {
      res.status(400).json({ error: 'Invalid request format. Expected an object with an "emails" property containing an array of email addresses.' });
      return;
    }
  
    global.emails = req.body.emails;
  
    // Ensure that emails is an array before attempting to iterate over it
    if (!Array.isArray(emails)) {
      res.status(400).json({ error: 'Invalid request format. Expected an array of email addresses.' });
      return;
    }
    
    const resdata={
        requestid : requestid,
        statuscheck:"http://localhost:3000/"+requestid
    }

    res.json(resdata);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while validating the email address.' });
  }
});

const timeout = 1000;
global.results={};

const statusMap = new Map();

app.get('/:requestid', async (req, res) => {
  try {
    const requestid = req.params.requestid;

    if (statusMap.has(requestid)) {
      const status = statusMap.get(requestid);
      res.json(status);
      return;
    }

    if (!global.emails) {
      res.status(400).json({ error: 'No email addresses to validate. Please make a POST request to /validate with an "emails" property containing an array of email addresses.' });
      return;
    }

    const emails = global.emails;
    const promises = emails.map(async (email) => {
      try {
        const result = await validator.validate(email, transporter);
        return { email, result: result.valid ? 'valid' : 'invalid:'+' '+result.reason };
      } catch (err) {
        console.error(`Failed to validate ${email}: ${err.message}`);
        return { email, result: 'unknown' };
      }
    });
    
    const results = {};
    
    Promise.all(promises).then((validationResults) => {
      validationResults.forEach(({ email, result }) => {
        results[email] = result;
      });
      const status = { results };
    statusMap.set(requestid, status);
    
    res.write(`data: ${JSON.stringify(status)}\n\n`);
    res.end();
}).catch((err) => {
  console.error(`Failed to validate emails: ${err.message}`);
});

} catch (error) {
    console.error('Email validation failed:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('API listening on port 3000');
});


