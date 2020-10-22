import React from 'react';
import ReactLoader from 'react-loaders';
import 'loaders.css/src/animations/line-spin-fade-loader.scss';
import styles from './Loader.module.css';

const Loader: React.FC<{ height?: number }> = ({ height }) => {
	return (
		<div className={styles.loaderContainer} style={{ height }}>
			<ReactLoader type={'line-spin-fade-loader'} active innerClassName={styles.innerPiece} />
		</div>
	);
};

export default Loader;
