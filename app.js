const dns = require('dns');
const net = require('net');

function checkMailbox(emailAddress) {
  const domainName = emailAddress.split('@')[1];

  dns.resolveMx(domainName, (error, addresses) => {
    if (error) {
      console.log(`Error resolving MX records: ${error}`);
      setTimeout(() => {
        checkMailbox(emailAddress); // retry after 5 seconds
      }, 5000);
      return;
    }

    const mxRecord = addresses[0].exchange;
    const client = net.createConnection({
      host: mxRecord,
      port: 25,
      timeout: 5000
    });

    client.on('connect', () => {
      console.log(`Connected to ${mxRecord}`);
      client.write(`HELO ${domainName}\r\n`);
      client.write(`MAIL FROM: <noreply@${domainName}>\r\n`);
      client.write(`RCPT TO: <${emailAddress}>\r\n`);
      client.write('QUIT\r\n');
    });

    client.on('data', (data) => {
      console.log(data.toString());
      if (data.toString().includes('250 2.1.5')) {
        console.log(`Mailbox ${emailAddress} exists`);
      } else {
        console.log(`Mailbox ${emailAddress} does not exist`);
      }
      client.end();
    });

    client.on('error', (error) => {
      console.log(`Error: ${error}`);
      setTimeout(() => {
        checkMailbox(emailAddress); // retry after 5 seconds
      }, 5000);
    });

    client.on('timeout', () => {
      console.log('Connection timed out');
      client.destroy();
      setTimeout(() => {
        checkMailbox(emailAddress); // retry after 5 seconds
      }, 5000);
    });

    client.on('end', () => {
      console.log('Connection closed');
    });
  });
}

checkMailbox('mohamedaskar1002@gmail.com');