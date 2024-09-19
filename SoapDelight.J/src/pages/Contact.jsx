import React from 'react';
import ContactForm from '../components/contactForm';
// import ContactForm from '../components/ContactForm';

const Contact = () => {
  return (
    <div className="min-h-screen px-6 py-0 mt-5 ">
      <h1 className="text-4xl font-bold mb-4 text-center">聯絡我們</h1>
      <ContactForm />
    </div>
  );
};

export default Contact;
