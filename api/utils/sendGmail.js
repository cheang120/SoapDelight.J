const nodemailer = require("nodemailer")
const MailGen = require("mailgen")



const sendGmail = async(subject, send_to, template, cc) => {
        // Create Email Transporter
        const Transporter = nodemailer.createTransport({
            service:"gmail",
            host: process.env.EMAIL_HOST_G,
            port:587,
            auth:{
                user: process.env.EMAIL_USER_G,
                pass: process.env.EMAIL_PASS_G
            }
        })

          // Create Template With MailGen
        const mailGenerator = new MailGen({
            theme: "salted",
            product: {
            name: "SoapDelight.J",
            link: "https://soapdelight-j.onrender.com/",
            },
        });
        const emailTemplate = mailGenerator.generate(template);
        require("fs").writeFileSync("preview.html", emailTemplate, "utf8");

          // Options f0r sending email
        const options = {
            from: process.env.EMAIL_USER,
            to: send_to,
            replyTo: reply_to,
            subject,
            html: emailTemplate,
            cc,
        };

          // Send Email
        transporter.sendMail(options, function (err, info) {
            if (err) {
            console.log(err);
            } else {
            console.log(info);
            }
        });
}



module.exports = sendGmail