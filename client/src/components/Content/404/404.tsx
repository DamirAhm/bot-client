import React from 'react';
import { Redirect, useLocation } from 'react-router-dom';
import styles from './404.module.css';

const style = {
	fontSize: '2rem',
	color: 'var(--main)',
	padding: ' 0 20px',
};

const Page404: React.FC = () => {
	return (
		<div style={style} className={styles.container}>
			Простите ничего не нашлось 😢😭
		</div>
	);
};

export const RedirectTo404: React.FC = () => {
	const location = useLocation();
	console.log(location);
	return <Redirect to='/404' />;
};

export default Page404;
