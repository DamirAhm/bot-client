import React from 'react';
import { attachment } from '../../../types';
import OpenableImg, { OpenableImgProps, ImgStab } from './OpenableImage';
import styles from './OpenableImage.module.css';
type Props = {
	images: (attachment & React.ImgHTMLAttributes<HTMLImageElement>)[];
	Stab?: React.FC<React.HTMLAttributes<HTMLDivElement> & { onClick: () => void }>;
};

export interface Image {
	url: string;
	_id?: string;
}

export const connectImages: (atts: Image[]) => (OpenableImgProps & { _id: string })[] = (
	attachments,
) => {
	const parsedAttachments: (OpenableImgProps & { _id: string })[] = [];

	for (let i = 0; i < attachments.length; i++) {
		const attachment = { ...attachments[i] };
		const newImgProps: OpenableImgProps & { _id: string } = {} as OpenableImgProps & {
			_id: string;
		};
		newImgProps.src = attachment.url;
		newImgProps._id = attachment._id || i.toString();

		const { url, _id, ...rest } = attachment;

		Object.assign(newImgProps, rest);
		parsedAttachments.push(newImgProps);
	}
	if (parsedAttachments.length > 1) {
		for (let i = 0; i < parsedAttachments.length; i++) {
			if (i + 1 < parsedAttachments.length) {
				parsedAttachments[i].nextImg = parsedAttachments[i + 1];
			} else {
				parsedAttachments[i].nextImg = parsedAttachments[0];
			}
			if (i - 1 >= 0) {
				parsedAttachments[i].prevImg = parsedAttachments[i - 1];
			} else {
				parsedAttachments[i].prevImg = parsedAttachments[parsedAttachments.length - 1];
			}
		}
	}
	return parsedAttachments;
};

const ImgAlbum: React.FC<Props> = ({ images, Stab }) => {
	const parsedImages = connectImages(images);

	return (
		<>
			{Stab ? (
				<ImgStab {...parsedImages[0]} Stab={Stab} />
			) : (
				<>
					{parsedImages.map((at) => (
						<OpenableImg key={at._id} alt="Фото дз" {...at} />
					))}
				</>
			)}
		</>
	);
};

export default ImgAlbum;
