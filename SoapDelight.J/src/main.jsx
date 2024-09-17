import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import {store, persistor} from './redux/store.js'
import {Provider} from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react';
import ThemeProvider from './components/ThemeProvider.jsx'
import WhatsAppButton from './components/WhatsappButton.jsx'



const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <PersistGate persistor={persistor}>
      <Provider store={store}>
        <ThemeProvider>
          <App />
          <WhatsAppButton />
        </ThemeProvider>
      </Provider>
    </PersistGate>
  );
}
