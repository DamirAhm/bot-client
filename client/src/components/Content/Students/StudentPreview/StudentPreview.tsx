import React, { memo } from 'react';
import styles from './StudentPreview.module.css';
import {
	convertStudentInfoValue,
	getPrettyName,
	highlightSearch,
} from '../../../../utils/functions';
import { Link } from 'react-router-dom';
import { studentPreview } from '../Students';

type Props = {
	searchText?: string;
	visibleInfo?: (keyof Omit<studentPreview, '_id'>)[];
} & studentPreview;

const StudentPreview: React.FC<Props> = ({
	searchText,
	visibleInfo = ['fullName', 'role', 'className', 'schoolName'],
	children,
	...info
}) => {
	const highlighter = (str: string) => {
		return highlightSearch(str, searchText || '');
	};

	return (
		<div className={`${styles.preview}`}>
			<Link to={`/students/${info.vkId}`} className={`${styles.link}`}>
				{visibleInfo.map((key) => (
					<span key={key} className={`${styles.info} ${styles[key]}`}>
						{highlighter(
							(() => {
								const value = info[key];
								if (key === 'fullName' && typeof value === 'string') {
									return getPrettyName(
										value || '',
										value
											?.split(' ')[0]
											.toLowerCase()
											.search(searchText?.toLowerCase() || '') === -1,
									);
								}
								return convertStudentInfoValue(value, key);
							})(),
						)}
					</span>
				))}
			</Link>
		</div>
	);
};

export default memo(StudentPreview);
