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
const fullSiteRegExp = /^(https?:\/\/)?([\w-]{1,32}\.[\w-]{1,32})[^\s@]*$/gi;
const emailRegExp = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi;
const fullEmailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gi;

const replaceHrefsByAnchors = (text: string): JSX.Element => {
	const siteMatch = text.match(siteRegExp);

	if (siteMatch) {
		const slices = text.split(new RegExp(siteMatch.join('|'))).filter(Boolean);

		for (let i = 0; i < siteMatch.length; i++) {
			slices.splice(i * 2 + 1, 0, siteMatch[i]);
		}

		for (let i = 0; i < slices.length - 1; i++) {
			if (slices[i].charAt(slices[i].length - 1) === '@') {
				slices[i] += slices[i + 1];
				slices.splice(i + 1, 1);
			}
		}

		let res: (string | JSX.Element)[] = [];

		for (const slice of slices) {
			if (slice.match(fullSiteRegExp)) {
				const element = (
					<React.Fragment key={slice}>
						{typeof res[res.length - 1] === 'string' && <br />}
						<a href={slice} className={styles.hyperlink}>
							{slice}
						</a>
						<br />
					</React.Fragment>
				);

				res.push(element);
			} else {
				const emailMatch = slice.match(emailRegExp);

				if (emailMatch) {
					let emailSlices = slice
						.split(new RegExp(emailMatch.join('|')))
						.filter((str) => Boolean(str.trim()));

					for (let i = 0; i < emailMatch.length; i++) {
						emailSlices.splice(i * 2 + 1, 0, emailMatch[i]);
					}
					if (emailSlices.length === 0) emailSlices = [emailMatch[0]];

					for (const emailSlice of emailSlices) {
						if (emailSlice.match(fullEmailRegExp)) {
							const element = (
								<React.Fragment key={emailSlice}>
									{typeof res[res.length - 1] === 'string' && <br />}
									<a href={`mailto:${emailSlice}`} className={styles.hyperlink}>
										{emailSlice}
									</a>
									<br />
								</React.Fragment>
							);

							res.push(element);
						} else {
							res.push(emailSlice);
						}
					}
				} else {
					res.push(slice);
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
