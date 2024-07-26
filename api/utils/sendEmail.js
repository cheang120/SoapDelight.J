// import nodemailer from 'nodemailer';
// import hbs from 'nodemailer-express-handlebars';
// import path from 'path';

// const sendEmail = async (
//   subject,
//   send_to,
//   sent_from,
//   reply_to,
//   template,
//   name,
//   link
// ) => {
//   try {
//     // Log environment variables for debugging (Do not do this in production)
//     // console.log("EMAIL_HOST:", process.env.EMAIL_HOST);
//     // console.log("EMAIL_USER:", process.env.EMAIL_USER);
//     // console.log("EMAIL_PASS:", process.env.EMAIL_PASS ? '******' : 'Not set'); // Mask the password

//     // Create Email Transporter
//     const transporter = nodemailer.createTransport({
//       host: process.env.EMAIL_HOST,
//       port: 587,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       tls: {
//         rejectUnauthorized: false,
//       },
//     });

//     const handlebarOptions = {
//       viewEngine: {
//         extName: ".handlebars",
//         partialsDir: path.resolve("./api/views"),
//         defaultLayout: false,
//       },
//       viewPath: path.resolve("./api/views"),
//       extName: ".handlebars",
//     };

//     transporter.use("compile", hbs(handlebarOptions));

//     // Options for sending email
//     const options = {
//       from: sent_from,
//       to: send_to,
//       replyTo: reply_to,
//       subject,
//       template,
//       context: {
//         name,
//         link,
//       },
//     };

//     // Send Email
//     let info = await transporter.sendMail(options);
//     console.log('Email sent: ', info);
//   } catch (err) {
//     if (err.responseCode === 535) {
//       console.error('Authentication failed. Please check your SMTP server credentials.');
//     } else {
//       console.error('Error occurred: ', err);
//     }
//   }
// };

// export default sendEmail;

import sendgrid from '@sendgrid/mail';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

// Load environment variables
dotenv.config();

// Set API key
sendgrid.setApiKey(process.env.SENDGRID_API_KEY);


// Example function to send an email
const sendEmail = async (subject, send_to, sent_from, reply_to,name, template,link) => {
  // console.log("hello");
  // console.log(subject, send_to, sent_from, reply_to, template,name, link);
console.log('this is' + link);

  try {

    const msg = {
      to: send_to,
      from: sent_from,
      replyTo: reply_to,
      subject: subject,
      // template:verifyEmail,
      text: `Hello ${name}, please visit this link: ${link}`,
      // html: `<strong>Hello ${name}</strong>, please visit this link: <a href="${link}">${link}</a>`,
      html: `
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Document</title>
        <style>
          body { background-color: #0a1930; padding: 30px; font-family: Arial,
          Helvetica, sans-serif; } .container { background-color: #eee; padding:
          10px; border-radius: 3px; } .color-primary { color: #007bff; }
          .color-danger { color: orangered; } .color-success { color: #28a745; }
          .color-white { color: #fff; } .color-blue { color: #0a1930; } a {
          font-size: 1.4rem; text-decoration: none; } .btn { font-size: 1.4rem;
          font-weight: 400; padding: 6px 8px; margin: 0 5px 0 0; border: 1px solid
          transparent; border-radius: 3px; cursor: pointer; } .btn-primary { color:
          #fff; background: #007bff; } .btn-secondary { color: #fff; border: 1px
          solid #fff; background: transparent; } .btn-danger { color: #fff;
          background: orangered; } .btn-success { color: #fff; background: #28a745;
          } .flex-center { display: flex; justify-content: center; align-items:
          center; } .logo { padding: 5px; background-color: #1f93ff; } .my { margin:
          2rem 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo flex-center">
            <h2 class="color-white">BabyCode</h2>
          </div>
          <h2>Hello <span class="color-danger">${name}</span></h2>
          <p>Please use the url below to verify your account</p>
          <p>This link is valid for 1hrs</p>

          <a href=${link} class="btn btn-success">Verify Account</a>

          <div class="my">
            <p>Regards...</p>
            <p><b class="color-danger">BabyCode</b> Team</p>
          </div>
        </div>
      </body>
      
      `
    };
    // console.log(msg);
    const response = await sendgrid.send(msg);
    console.log('Email sent:', response);

  } catch (error) {
    console.error('Error sending email:', error);
    if (error.response) {
      console.error('Response body:', error.response.body);
    }
  }
  // const draft = {
  //   "to":"carrey.120.cc@gmail.com",
  //   "from":"carrey.120.cc@gmail.com",
  //   "subject":"Sendgrid",
  //   "text":"Hello"
  // }
  // const response = await sendgrid.send(draft)
  // console.log(response);

};

// Test sending an email
// sendEmail(
//   'Verify Your Account - BabyCode',
//   'carrey.120.cc@gmail.com',
//   'carrey.120.cc@gmail.com',
//   'noreply@babycode.com',
//   '',
//   'User',
//   'http://localhost:5173/verify/f9322307bf0aa5b23b1f5630e8dd13d5c49a036902534968b14e05dbb7d5fd31669a0f67cb7b5eb1d436d7c7'
// );

export default sendEmail;