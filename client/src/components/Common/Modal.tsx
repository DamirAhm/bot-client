import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

type ModalProps = {
	children: JSX.Element | (JSX.Element | undefined)[];
	onClose?: () => void;
	rootElement: Element;
};

const Modal: React.FC<ModalProps> = ({ children, onClose, rootElement }) => {
	const keyDownHandler = (e: KeyboardEvent) => {
		if (e.key === 'Escape') {
			onClose?.();
		}
	};
	useEffect(() => {
		document.addEventListener('keydown', keyDownHandler);

		return () => {
			document.removeEventListener('keydown', keyDownHandler);
		};
	}, []);

	return ReactDOM.createPortal(
		<div className="modal" onMouseDown={onClose}>
			{children}
		</div>,
		rootElement,
	);
};

export default Modal;
