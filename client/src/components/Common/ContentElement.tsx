import React from 'react';
import { content, redactorOptions } from '../../types';
import styles from '../Content/ClassPage/Sections/Common/ContentSection.module.css';
import ImgAlbum from './OpenableImage/ImgAlbum';
import Options from './Options/Options';

type Props = {
	content: content;
	removeContent: (contentId: string) => void;
	setChanging: (contentId: string) => void;
	pin: (contentId: string) => void;
};

const siteRegExp = /(https?:\/\/)?([\w-]{1,32}\.[\w-]{1,32})[^\s@]*/gi;

const replaceHrefsByAnchors = (text: string): JSX.Element => {
	const match = text.match(siteRegExp);

	if (match) {
		const slices = text.split(new RegExp(match.join('|')));

		for (let i = 0; i < match.length; i++) {
			slices.splice(i + 1, 0, match[i]);
		}

		let res: (string | JSX.Element)[] = [];

		for (const slice of slices) {
			if (slice.match(siteRegExp)) {
				const element = (
					<React.Fragment key={slice}>
						{typeof res[res.length - 1] === 'string' && <br />}
						<a href={slice} className={styles.hyperlink} key={slice}>
							{slice}
						</a>
						<br />
					</React.Fragment>
				);

				if (res) {
					res.push(element);
				} else {
					res = [element];
				}
			} else {
				if (res) {
					res.push(slice);
				} else {
					res = [slice];
				}
			}
		}

		return <span className={styles.text}>{res}</span>;
	} else {
		return <span className={styles.text}>{text}</span>;
	}
};

const ContentElement: React.FC<Props> = ({ content, removeContent, setChanging, pin }) => {
	const textWithReplacedHrefs = replaceHrefsByAnchors(content.text);

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
				{content.text && textWithReplacedHrefs}
			</div>
			<div className={styles.controls}>
				<Options
					include={[
						content.pinned ? redactorOptions.unpin : redactorOptions.pin,
						redactorOptions.change,
						redactorOptions.delete,
					]}
					props={{
						[redactorOptions.pin]: {
							size: 25,
							onClick: () => pin(content._id as string),
						},
						[redactorOptions.unpin]: {
							size: 25,
							onClick: () => pin(content._id as string),
						},
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
