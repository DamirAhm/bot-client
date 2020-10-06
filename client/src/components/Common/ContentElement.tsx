import React from 'react';
import { content, redactorOptions } from '../../types';
import styles from '../Content/ClassPage/Sections/Common/ContentSection.module.css';
import ImgAlbum from './OpenableImage/ImgAlbum';
import Options from './Options/Options';

type Props = {
	content: content;
	removeContent: (contentId: string) => void;
	setChanging: (contentId: string) => void;
};

const ContentElement: React.FC<Props> = ({ content, removeContent, setChanging }) => {
	return (
		<div
			className={`${styles.container} ${content.attachments.length === 2 ? styles.pair : ''}`}
			onDoubleClick={() => setChanging(content._id as string)}
		>
			<div key={content._id} className={styles.element}>
				{content.attachments.length > 0 && (
					<>
						{content.attachments.length <= 2 ? (
							<div
								className={styles.attachments}
								onDoubleClick={(e) => e.stopPropagation()}
							>
								<ImgAlbum images={content.attachments} />
							</div>
						) : (
							<div onDoubleClick={(e) => e.stopPropagation()}>
								<ImgAlbum
									images={content.attachments}
									Stab={({ onClick }) => (
										<div className={styles.stab} onClick={onClick}>
											<span>{content.attachments.length}</span>
											<span> Photos </span>
										</div>
									)}
								/>
							</div>
						)}
					</>
				)}
				{content.text && <p className={styles.text}> {content.text} </p>}
			</div>
			<div className={styles.controls}>
				<Options
					include={[redactorOptions.change, redactorOptions.delete]}
					props={{
						[redactorOptions.change]: {
							onClick: () => setChanging(content._id as string),
							className: `${styles.pen}`,
							size: 20,
						},
						[redactorOptions.delete]: {
							onClick: () => removeContent(content._id as string),
							className: `${styles.remove}`,
							size: 25,
						},
					}}
					withRoleControl
				/>
			</div>
		</div>
	);
};

export default ContentElement;