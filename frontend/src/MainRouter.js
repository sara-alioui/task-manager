import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const MainRouter = () => {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

export default MainRouter;