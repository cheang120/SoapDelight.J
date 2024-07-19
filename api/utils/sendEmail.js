import nodemailer from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import path from 'path';

const sendEmail = async (
  subject,
  send_to,
  sent_from,
  reply_to,
  template,
  name,
  link
) => {
  try {
    // Log environment variables for debugging (Do not do this in production)
    // console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
    // console.log("EMAIL_USER:", process.env.EMAIL_USER);
    // console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? '******' : 'Not set'); // Mask the password

    // Create Email Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: 587,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const handlebarOptions = {
      viewEngine: {
        extName: ".handlebars",
        partialsDir: path.resolve("./api/views"),
        defaultLayout: false,
      },
      viewPath: path.resolve("./api/views"),
      extName: ".handlebars",
    };

    transporter.use("compile", hbs(handlebarOptions));

    // Options for sending email
    const options = {
      from: sent_from,
      to: send_to,
      replyTo: reply_to,
      subject,
      template,
      context: {
        name,
        link,
      },
    };

    // Send Email
    let info = await transporter.sendMail(options);
    console.log('Email sent: ', info);
  } catch (err) {
    if (err.responseCode === 535) {
      console.error('Authentication failed. Please check your SMTP server credentials.');
    } else {
      console.error('Error occurred: ', err);
    }
  }
};

export default sendEmail;