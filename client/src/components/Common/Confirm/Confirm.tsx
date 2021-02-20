import React from 'react';
import ReactDOM from 'react-dom';
import Modal from '../Modal';
import styles from './Confirm.module.css';

type Props = {
	text?: string;
	returnRes?: (res: boolean) => void;
	onConfirm?: () => void;
	onReject?: () => void;
	confirmElement?: JSX.Element;
	rejectElement?: JSX.Element;
};

const Confirm: React.FC<Props> = ({
	text = 'Вы уверены что хотите совершить это действие',
	returnRes,
	confirmElement,
	onConfirm,
	onReject,
	rejectElement,
}) => {
	const modalRoot = document.querySelector('#confirmModal');

	const chooseHandler = (res: boolean) => {
		if (res && onConfirm) onConfirm();
		else if (!res && onReject) onReject();

		returnRes?.(res);
	};

	return (
		modalRoot && (
			<Modal rootElement={modalRoot}>
				<div className={styles.container}>
					<span className={styles.text}>{text}</span>
					<div className={styles.options}>
						{confirmElement ? (
							rejectElement
						) : (
							<button
								onClick={() => chooseHandler(false)}
								data-testid={'reject'}
								className={`${styles.btn} ${styles.reject}`}
							>
								Нет
							</button>
						)}
						{rejectElement ? (
							confirmElement
						) : (
							<button
								onClick={() => chooseHandler(true)}
								data-testid={'confirm'}
								className={`${styles.btn} ${styles.confirm}`}
							>
								Да
							</button>
						)}
					</div>
				</div>
			</Modal>
		)
	);
};

export default Confirm;
