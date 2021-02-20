import React from 'react';
import { changeTypes, content, redactorOptions } from '../../types';
import { replaceHrefsByAnchors } from '../../utils/functions';
import styles from '../Content/ClassPage/Sections/Common/ContentSection.module.css';
import ImgAlbum from './OpenableImage/ImgAlbum';
import Options from './Options/Options';

type Props = {
	content: content;
	removeContent: (contentId: string) => void;
	setChanging: (contentId: string, changeType: changeTypes) => void;
	pin: (contentId: string) => void;
	withUserPreferences?: boolean;
};

const ContentElement: React.FC<Props> = ({
	content,
	removeContent,
	setChanging,
	pin,
	withUserPreferences = false,
}) => {
	const textWithReplacedHrefs = replaceHrefsByAnchors(content.text, styles);

	return (
		<div
			className={`${styles.container} ${content.attachments.length === 2 ? styles.pair : ''}`}
			onDoubleClick={() => setChanging(content._id as string, changeTypes.content)}
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
				{content.text && textWithReplacedHrefs}
			</div>
			<div className={styles.controls}>
				<Options
					include={
						withUserPreferences
							? [
									redactorOptions.pin,
									redactorOptions.settings,
									redactorOptions.change,
									redactorOptions.delete,
							  ]
							: [redactorOptions.pin, redactorOptions.change, redactorOptions.delete]
					}
					props={{
						[redactorOptions.pin]: {
							onClick: () => pin(content._id as string),
							className: content.pinned ? styles.unpin : styles.pin,
						},
						[redactorOptions.settings]: {
							onClick: () =>
								setChanging(content._id as string, changeTypes.userPreferences),
						},
						[redactorOptions.change]: {
							onClick: () => setChanging(content._id as string, changeTypes.content),
							className: styles.pen,
							size: 20,
						},
						[redactorOptions.delete]: {
							onClick: () => removeContent(content._id as string),
							className: styles.remove,
						},
					}}
					className={styles.optionIcon}
					size={25}
					withRoleControl
				/>
			</div>
		</div>
	);
};

export default ContentElement;
