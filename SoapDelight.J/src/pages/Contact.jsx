import React from 'react';
import ContactForm from '../components/contactForm';

const Contact = () => {
  window.scrollTo(0, 0);
  return (
    <div className="min-h-screen px-6 pt-10 bg-white dark:bg-gray-900">
      <h1 className="text-4xl font-bold mb-4 text-center text-gray-900 dark:text-gray-200">聯絡我們</h1>
      <ContactForm />
    </div>
  );
};

export default Contact;
