import nodemailer from "nodemailer";
import MailGen from "mailgen";


export const sendGmail = async(subject, send_to,reply_to, template, cc) => {
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

          // 验证模板参数
  if (!template || !template.body) {
    throw new Error("Please provide parameters for generating transactional e-mails.");
  }

          // Create Template With MailGen
        const mailGenerator = new MailGen({
            theme: "salted",
            product: {
            name: "SoapDelight.J",
            link: "https://soapdelight-j.onrender.com/",
            },
        });
        const emailTemplate = mailGenerator.generate(template);

          // Options f0r sending email
        const options = {
            from: process.env.EMAIL_USER_G,
            to: send_to,
            replyTo: reply_to,
            subject,
            html: emailTemplate,
            cc,
        };

          // Send Email
        const info = await Transporter.sendMail(options);
        console.log(info);
        return info;
}



// module.exports = sendGmail
