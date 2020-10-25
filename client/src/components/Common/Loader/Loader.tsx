import React from 'react';
import ReactLoader from 'react-loader';
import styles from './Loader.module.css';

const Loader: React.FC<{ height?: number }> = ({ height }) => {
	return (
		<div className={styles.loaderContainer} style={{ height }}>
			<ReactLoader loaded={false} color="var(--positive)" />
		</div>
	);
};

export default Loader;
