import React from 'react';
import { UserContext } from '../../../App';
import VKPlugin from '../../VKPlugin/VKPlugin';
import styles from './Auth.module.css';

type Props = {
	setUser: (user: returnUserType) => void;
};

const Auth: React.FC<Props> = ({ setUser }) => {
	const { vkId } = React.useContext(UserContext);

	return (
		<div className={styles.container}>
			<h1>
				{vkId === -1
					? 'Авторизуйтесь с помощью вконтакте'
					: 'Пожалуйста перезагрузите страницу'}
			</h1>
			<VKPlugin setUser={setUser} />
		</div>
	);
};

export default Auth;
