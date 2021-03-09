import React, { memo } from 'react';
import styles from './ClassPreview.module.css';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client';
import { highlightSearch } from '../../../../utils/functions';
import { Link, useParams } from 'react-router-dom';
import { redactorOptions } from '../../../../types';
import Options from '../../../Common/Options/Options';
import Confirm from '../../../Common/Confirm/Confirm';
import { useState } from 'react';

type Props = {
	className: string;
	studentsCount: number;
	searchText?: string;
};

// language=GraphQL
const DELETE_CLASS = gql`
	mutation RemoveOne($className: String!, $schoolName: String!) {
		classRemoveOne(className: $className, schoolName: $schoolName) {
			name
			__typename
		}
		deleteClass(className: $className, schoolName: $schoolName) @client {
			_id
		}
	}
`;
const ClassPreview: React.FC<Props> = ({ className, studentsCount, searchText = '' }) => {
	const { schoolName } = useParams<{ schoolName: string }>();

	const [deleteClass, { error, data }] = useMutation<
		{ classRemoveOne: { record: { name: string } } },
		{ className: string; schoolName: string }
	>(DELETE_CLASS, {
		variables: { className, schoolName },
	});

	const [waitForConfirm, setWaitForConfirm] = useState(false);

	const highlighter = (str: string) => {
		return highlightSearch(str, searchText);
	};

	if (error) console.error(error);
	if (data) {
		return (
			<div className={styles.preview} style={{ backgroundColor: 'var(--secondary)' }}>
				<div className={styles.firstRow} />
				<div className={styles.secondRow} />
			</div>
		);
	}

	return (
		<>
			<div className={styles.preview}>
				<Link to={`/${schoolName}/classes/${className}`} className={styles.link}>
					<p className={styles.name}> {highlighter(className)} </p>
					<div className={styles.count}>
						Учеников: {highlighter(String(studentsCount))}
					</div>
					<div></div>
				</Link>
				<Options
					include={redactorOptions.delete}
					props={{
						onClick: () => setWaitForConfirm(true),
						size: 20,
						className: `remove ${styles.button}`,
					}}
					withRoleControl
					allowOnlyAdmin
				/>
			</div>
			{waitForConfirm && (
				<Confirm
					text={`Вы уверены что хотите удалить ${className} класс`}
					onConfirm={() => deleteClass()}
					returnRes={() => setWaitForConfirm(false)}
				/>
			)}
		</>
	);
};

export default memo(ClassPreview);
