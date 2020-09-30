import React, { MouseEvent, useState } from 'react';
import styles from './ClassPreview.module.css';
import { gql } from 'apollo-boost';
import { useMutation } from '@apollo/react-hooks';
import { GET_CLASSES, classPreview } from '../Classes';
import { Class, redactorOptions, WithTypename } from '../../../../types';
import Options from '../../../Common/Options/Options';
import { useParams } from 'react-router-dom';
const CREATE_CLASS = gql`
	mutation CreateClass($className: String!, $schoolName: String!) {
		#    createClass(name: $name) @client
		classCreateOne(className: $className, schoolName: $schoolName) {
			name
			__typename
			studentsCount
		}
	}
`;

const ClassCreator: React.FC = () => {
	const { schoolName } = useParams<{ schoolName: string }>();
	const [creating, setCreating] = useState<boolean>(false);
	const [name, setName] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [createClass] = useMutation<
		{ classCreateOne: WithTypename<classPreview> },
		{ name: string }
	>(CREATE_CLASS, {
		variables: {
			name: name.toUpperCase().replace(/\s/g, ''),
		},
		optimisticResponse: {
			classCreateOne: {
				name,
				studentsCount: 0,
				schoolName,
				__typename: 'Class',
			},
		},
		update: (proxy, data) => {
			if (data.data) {
				proxy.writeQuery({
					query: GET_CLASSES,
					data: {
						classes: proxy
							.readQuery<{ classes: WithTypename<classPreview>[] }>({
								query: GET_CLASSES,
							})
							?.classes.concat([data.data?.classCreateOne]),
					},
				});
			}
		},
	});

	const clear = (e: MouseEvent) => {
		e.stopPropagation();
		setCreating(false);
		setName('');
		setError(null);
	};

	const confirm = (e: React.FormEvent) => {
		e.preventDefault();
		if (matchClassName(name)) {
			createClass();
			setCreating(false);
			setName('');
			setError(null);
		} else {
			setName('');
			setError('Неверное имя класса');
		}
	};

	return (
		<div className={styles.wrapper}>
			<div
				className={`${styles.creator} ${!creating ? styles.creator_stab : ''} ${
					styles.preview
				}`}
				onClick={() => setCreating(true)}
			>
				{creating ? (
					<form onSubmit={confirm} className={styles.form}>
						<Options
							include={redactorOptions.reject}
							size={20}
							onClick={clear}
							className={`reject ${styles.button}`}
						/>
						<input
							onChange={(e) => setName(e.target.value)}
							value={name}
							autoFocus={true}
							type="text"
							placeholder={error ?? 'Имя класса в формате цифра буква'}
							className={`${error ? styles.with_error : ''} ${styles.input}`}
						/>
						<Options
							include={redactorOptions.confirm}
							size={20}
							onClick={confirm}
							className={`confirm ${styles.button}`}
						/>
					</form>
				) : (
					'Create class'
				)}
			</div>
		</div>
	);
};

const matchClassName = (name: string): readonly [number, string] | null => {
	if (/([0-9]{1,2})\s*([A-Z]|[А-Я]){1}/i.test(name)) {
		const res = name.match(/([0-9]{1,2})\s*([A-Z]|[А-Я]){1}/i);

		if (res !== null) {
			const [, digit, letter] = res;

			if (+digit > 0 && +digit <= 12) {
				return [+digit, letter] as const;
			}
		}
	}

	return null;
};

export default ClassCreator;
