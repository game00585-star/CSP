import React from 'react';import ReactDOM from 'react-dom/client';import App from './App';import './index.css';import './pages/workflowDetails.css';

const savedTheme=localStorage.getItem('csp_dark_mode');
document.documentElement.classList.toggle('dark-theme',savedTheme!=='false');

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
