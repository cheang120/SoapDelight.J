import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { fileURLToPath } from "url";

dotenv.config();
dotenv.config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  override: true,
});

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const getEmailCopy = (subject, safeName, safeLink) => {
  const isReset = /password reset/i.test(subject);
  const actionLabel = isReset ? "重設密碼" : "驗證帳戶";
  const intro = isReset
    ? "我們收到重設密碼的申請，請按以下按鈕繼續。"
    : "請按以下按鈕完成您的 SoapDelight.J 帳戶驗證。";
  const expiry = isReset
    ? "此連結有效時間為 1 小時。"
    : "此驗證連結有效時間為 1 小時。";

  return `
    <html lang="zh-Hant">
      <head>
        <meta charset="UTF-8" />
        <meta http-equiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(subject)}</title>
        <style>
          body {
            margin: 0;
            background: #f5f7f4;
            color: #18181b;
            font-family: Arial, Helvetica, sans-serif;
          }
          .wrapper {
            max-width: 640px;
            margin: 0 auto;
            padding: 32px 20px;
          }
          .card {
            background: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 18px;
            padding: 32px 28px;
          }
          .brand {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: 0.02em;
            margin: 0 0 18px;
          }
          .title {
            font-size: 24px;
            font-weight: 700;
            margin: 0 0 12px;
          }
          .body {
            margin: 0 0 12px;
            line-height: 1.7;
            color: #3f3f46;
          }
          .button {
            display: inline-block;
            margin: 18px 0 10px;
            padding: 12px 20px;
            border-radius: 999px;
            background: #18181b;
            color: #ffffff !important;
            text-decoration: none;
            font-weight: 600;
          }
          .footnote {
            margin: 12px 0 0;
            font-size: 13px;
            line-height: 1.6;
            color: #71717a;
            word-break: break-word;
          }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <p class="brand">SoapDelight.J</p>
            <h1 class="title">${escapeHtml(subject)}</h1>
            <p class="body">您好，${safeName}</p>
            <p class="body">${intro}</p>
            <a class="button" href="${safeLink}">${actionLabel}</a>
            <p class="body">${expiry}</p>
            <p class="footnote">如按鈕未能正常開啟，請複製以下連結並貼到瀏覽器：</p>
            <p class="footnote">${safeLink}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

const sendEmail = async (subject, send_to, sent_from, reply_to, name, link) => {
  const emailUser = process.env.EMAIL_USER || sent_from;
  if (!emailUser) {
    throw new Error("Email service is not configured (missing EMAIL_USER).");
  }
  if (!process.env.EMAIL_PASS) {
    throw new Error("Email service is not configured (missing EMAIL_PASS).");
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: emailUser,
      pass: process.env.EMAIL_PASS,
    },
  });

  const safeName = escapeHtml(name || "客人");
  const safeLink = String(link || "");
  const mailOptions = {
    from: `SoapDelight.J <${emailUser}>`,
    to: send_to,
    replyTo: reply_to || emailUser,
    subject,
    html: getEmailCopy(subject, safeName, safeLink),
    text: `您好，${name || "客人"}。請開啟此連結：${safeLink}`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    const safeMessage =
      error?.responseCode
        ? `${error.message} (code ${error.responseCode})`
        : error?.message || "Unknown email provider error.";
    throw new Error(`Email send failed: ${safeMessage}`);
  }
};

export default sendEmail;
