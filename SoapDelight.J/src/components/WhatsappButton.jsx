import React from 'react';

const WhatsAppButton = () => {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-10 md:right-20">
      <a href="https://wa.me/85366157169?text=Hello" target="_blank" rel="noopener noreferrer">
        <button className="bg-green-500 hover:bg-green-600 text-white font-bold p-3 rounded-full flex items-center justify-center w-12 h-12 md:w-16 md:h-16">
          <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" alt="WhatsApp Logo" className="w-6 h-6 md:w-8 md:h-8" />
        </button>
      </a>
    </div>
  );
};

export default WhatsAppButton;