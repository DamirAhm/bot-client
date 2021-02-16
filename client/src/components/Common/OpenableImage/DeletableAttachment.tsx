import React from 'react';
import styles from './OpenableImage.module.css';
import { MdClose } from 'react-icons/md';
import OpenableImg from './OpenableImage';
import { attachment } from '../../../types';
type Props = {
	attachment: attachment;
	remove: (_id: string) => void;
};

const DeletableAttachment: React.FC<Props> = ({ attachment, remove }) => {
	return (
		<div className={styles.deletableAttachment}>
			<OpenableImg src={attachment.url} alt="вложение" />
			<MdClose
				size={20}
				onClick={() => remove(attachment._id)}
				className={styles.removeAttachment + ' negative'}
			/>
		</div>
	);
};

export default DeletableAttachment;
