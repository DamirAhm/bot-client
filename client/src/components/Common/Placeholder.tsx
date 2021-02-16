import React from 'react';
import Loader from './Loader/Loader';
import styles from './Placeholder.module.css';

const Placeholder: React.FC<{ width: number }> = ({ width }) => {
	return (
		<div className={styles.imagePlaceholder} style={{ width }}>
			<Loader height={300} />
		</div>
	);
};

export default Placeholder;
