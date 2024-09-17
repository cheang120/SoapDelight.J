const contactEmailTemplate = (username, email, whatsapp,content) => ({
    body: {
      name: username,
      intro: 'You have a new contact form submission!',
      table: {
        data: [
          {
            item: 'Username',
            description: username,
          },
          {
            item: 'Email',
            description: email,
          },
          {
            item: 'WhatsApp',
            description: whatsapp,
          },
          { 
            item: 'Content', 
            description: content,
          }
        ],
      },
      outro: 'Thank you for your message!',
    },
  });
  
  export default contactEmailTemplate;
  