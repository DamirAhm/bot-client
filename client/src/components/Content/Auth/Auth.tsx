import React from 'react';
import VKPlugin from '../../VKPlugin/VKPlugin';
import styles from './Auth.module.css';

type Props = {
	setUser: (user: returnUserType) => void;
};

const Auth: React.FC<Props> = ({ setUser }) => {
	return (
		<div className={styles.container}>
			<h1>Авторизуйтесь с помощью вконтакте</h1>
			<VKPlugin setUser={setUser} />
		</div>
	);
};

export default Auth;
