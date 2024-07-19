import net from 'net';

const testSMTPConnection = (host, port) => {
  const client = net.createConnection({ host, port }, () => {
    console.log('Connected to SMTP server');
    client.end(); // Close the connection after successful connection
  });

  client.on('error', (err) => {
    console.error('Connection error: ', err);
  });

  client.on('close', () => {
    console.log('Connection closed');
  });
};

// Replace with your SMTP server details
testSMTPConnection('smtp-mail.outlook.com', 587);