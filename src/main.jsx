import React from 'react';import ReactDOM from 'react-dom/client';import App from './App';import './index.css';import './pages/workflowDetails.css';import './presentation.css';import './premium-v2.css';
import './desktop-premium.css';

const savedTheme=localStorage.getItem('csp_dark_mode');
document.documentElement.classList.toggle('dark-theme',savedTheme==='true');

ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>);
