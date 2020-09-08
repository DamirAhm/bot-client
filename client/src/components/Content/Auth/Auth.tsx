import React, { useEffect } from 'react';
import styles from './Auth.module.css';

type Props = {
	setUser: (user: returnUserType) => void;
};

const Auth: React.FC<Props> = ({ setUser }) => {
	const authRef = React.createRef<HTMLDivElement>();

	useEffect(() => {
		if (process.env.NODE_ENV === 'production' && 'VK' in window) {
			VK.Widgets.Auth(styles.vk_auth, { onAuth: setUser, width: 200 });
		} else {
			if (process.env.NODE_ENV === 'development') {
				try {
					setUser(JSON.parse(process.env.REACT_APP_USER || ''));
				} catch (e) {
					showError();
				}
			} else {
				showError();
			}
		}
	});

	const showError = () => {
		if (authRef.current) {
			authRef.current.innerText =
				'Простите не удалось загрузить элемент авторизации 😔, попробуйте отключить блокировщик рекламы и перезагрузить страницу';
		}
	};

	return (
		<div className={styles.container}>
			<h1>Авторизуйтесь с помощью вконтакте</h1>
			<div id={styles.vk_auth} ref={authRef}></div>
		</div>
	);
};

export default Auth;
