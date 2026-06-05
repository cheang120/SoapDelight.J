const contactEmailTemplate = (username, email, whatsapp, content) => ({
  body: {
    name: username,
    intro: "您收到一則新的聯絡表單提交。",
    table: {
      data: [
        {
          item: "姓名",
          description: username,
        },
        {
          item: "電郵",
          description: email,
        },
        {
          item: "WhatsApp",
          description: whatsapp,
        },
        {
          item: "內容",
          description: content,
        },
      ],
    },
    outro: "請盡快跟進此訊息。",
  },
});

export default contactEmailTemplate;
