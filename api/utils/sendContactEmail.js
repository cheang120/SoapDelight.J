import nodemailer from "nodemailer"

// 創建發送郵件的函數
const sendMail = async (toEmail, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'your-email@gmail.com', // 替換為你的 Gmail
        pass: 'your-email-password',  // 替換為你的 Gmail 應用密碼
      },
    });

    const mailOptions = {
      from: 'your-email@gmail.com',  // 發送者郵件
      to: toEmail,                   // 接收者郵件
      subject: subject,              // 郵件主題
      text: text,                    // 郵件正文
    };

    // 發送郵件
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${toEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
};

module.exports = sendMail;
