import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import dotenv from 'dotenv';
import Shell from './components/Shell';

dotenv.config();

ReactDOM.render(
	<Shell>
		<App />
	</Shell>,
	document.getElementById('root'),
);

// serviceWorker.register();
