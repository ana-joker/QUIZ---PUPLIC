import React from 'react';
import { createRoot } from 'react-dom/client';
import { default as AppWrapper } from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import './src/index.css';

const DEVICE_KEY = 'qt_deviceId';
if (!localStorage.getItem(DEVICE_KEY)) {
  localStorage.setItem(DEVICE_KEY, crypto.randomUUID());
}
const deviceId = localStorage.getItem(DEVICE_KEY);


const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AppWrapper />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
