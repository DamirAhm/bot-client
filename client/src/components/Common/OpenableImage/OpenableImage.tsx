import React, { ImgHTMLAttributes, useState, HTMLAttributes } from 'react';
import ReactDOM from 'react-dom';
import { MdNavigateBefore, MdNavigateNext } from 'react-icons/md';
import Modal from '../Modal';
import styles from './OpenableImage.module.css';

export type OpenableImgProps = {
	prevImg?: OpenableImgProps;
	nextImg?: OpenableImgProps;
	src: string;
} & ImgHTMLAttributes<HTMLImageElement>;
type ModalImgProps = {
	close: () => void;
} & OpenableImgProps;
type changeImg = (
	img: { src: string; prevImg?: OpenableImgProps; nextImg?: OpenableImgProps },
	e: React.MouseEvent<SVGElement, MouseEvent>,
) => void;

const OpenableImg: React.FC<OpenableImgProps> = ({ prevImg, nextImg, ...props }) => {
	const [modalOpened, setModalOpened] = useState(false);

	const photoModal = document.getElementById('photoModal');

	return (
		<>
			<img
				{...props}
				data-testid="image"
				alt={props.alt || 'Открывающееся изображение'}
				onClick={() => setModalOpened(true)}
			/>
			{modalOpened &&
				photoModal &&
				ReactDOM.createPortal(
					<ModalImg
						close={() => setModalOpened(false)}
						prevImg={prevImg}
						nextImg={nextImg}
						{...props}
					/>,
					photoModal,
				)}
		</>
	);
};

const photoModal = document.getElementById('photoModal');
export const ImgStab: React.FC<
	OpenableImgProps & { Stab: React.FC<HTMLAttributes<HTMLDivElement> & { onClick: () => void }> }
> = ({ Stab, ...props }) => {
	const [modalOpened, setModalOpened] = useState(false);

	return (
		<>
			<Stab onClick={() => setModalOpened(true)} />
			{modalOpened && <ModalImg close={() => setModalOpened(false)} {...props} />}
		</>
	);
};

export const ModalImg: React.FC<ModalImgProps> = ({
	close,
	nextImg,
	prevImg,
	src: initSrc,
	...props
}) => {
	const [src, setSrc] = useState(initSrc);
	const [prev, setPrev] = useState(prevImg);
	const [next, setNext] = useState(nextImg);

	const toImg: changeImg = ({ src, prevImg, nextImg }, e) => {
		e.stopPropagation();
		setSrc(src);
		setPrev(prevImg);
		setNext(nextImg);
	};

	return (
		<>
			{photoModal && (
				<Modal rootElement={photoModal} onClose={close}>
					{prev && (
						<MdNavigateBefore
							data-testid="prevImg"
							size={40}
							className={`${styles.imageChanger} ${styles.prev}`}
							onMouseDown={(e) => toImg(prev, e)}
						/>
					)}
					<img
						data-testid="modalImg"
						alt={props.alt || 'Открытое изображение'}
						src={src}
						onMouseDown={(e) => e.stopPropagation()}
						onScroll={(e) => e.stopPropagation()}
						{...props}
						className={styles.modalImage}
					/>
					{next && (
						<MdNavigateNext
							data-testid="nextImg"
							size={40}
							className={`${styles.imageChanger} ${styles.next}`}
							onMouseDown={(e) => toImg(next, e)}
						/>
					)}
				</Modal>
			)}
		</>
	);
};

export default OpenableImg;
