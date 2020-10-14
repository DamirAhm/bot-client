import { useApolloClient, useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { UserContext } from '../../../App';
import useList from '../../../hooks/useList';
import { Student, User } from '../../../types';
import { changeTitle, highlightSearch } from '../../../utils/functions';
import Suspender from '../../Common/Suspender/Suspender';
import Filters from '../../Filters/Filters';
import { classPreview, GET_CLASSES } from '../Classes/Classes';
import { GET_STUDENTS_FOR_CLASS } from '../ClassPage/Sections/StudentSection/StudentsSection';
import { CHANGE_CLASS, GET_STUDENT_BY_VK_ID } from '../StudentPage/StudentPage';
import { studentPreview } from '../Students/Students';
import styles from './PickClass.module.css';

type fn<T> = (value: T) => T;

const PickClass: React.FC<{ setUser: (fn: fn<User | null>) => void }> = ({ setUser }) => {
	const { schoolName } = useParams<{ schoolName: string }>();
	const { uid } = useContext(UserContext);
	const { setFilter, items, setItems } = useList<classPreview>([]);

	const [searchText, setText] = useState('');

	const setSearchText = (str: string) => {
		str = str.toLowerCase();

		const isMatch = (c: classPreview, str: string): boolean => c.name.search(str) !== -1;

		setText(str);
		setFilter((c) => isMatch(c, str));
	};
	const highlighter = (str: string) => {
		return highlightSearch(str, searchText);
	};

	const query = useQuery<{ classes: classPreview[] }, { schoolName: string }>(GET_CLASSES, {
		variables: { schoolName },
	});
	const [changeClass] = useMutation<
		{
			changeClass: Partial<Student> & { __typename: string };
			__typename: string;
		},
		{ vkId: number; className: string; schoolName: string }
	>(CHANGE_CLASS);

	const onClick = (className: string, schoolName: string) => {
		changeClass({
			variables: {
				schoolName,
				className,
				vkId: uid,
			},
			optimisticResponse: {
				changeClass: {
					vkId: uid,
					__typename: 'Student',
					className: className,
				},
				__typename: 'Mutation',
			},
			refetchQueries: [
				{
					query: GET_STUDENTS_FOR_CLASS,
					variables: {
						className,
						schoolName,
					},
				},
				{
					query: GET_STUDENT_BY_VK_ID,
					variables: { vkId: uid },
				},
			],
			update: async (proxy, response) => {
				if (response.data) {
					let { changeClass } = response.data;

					if (changeClass) {
						const { __typename, ...student } = changeClass;

						if (student) {
							setUser((user) =>
								user ? { ...user, ...student, schoolName, className } : null,
							);
						}
					}
				}
			},
		});
	};

	useEffect(() => {
		if (query.data?.classes) {
			setItems(query.data.classes);
		}
	}, [query]);
	useEffect(() => {
		changeTitle('Выберите класс');
	});

	return (
		<div className="centerer">
			<Suspender query={query}>
				<div className={styles.container}>
					<div>
						<span className={styles.title}>В каком классе вы учитесь? 📚</span>
					</div>
					<Filters
						inputProps={{ className: styles.filterInput }}
						className={styles.filters}
						setSearchText={setSearchText}
					/>
					{items.map((Class) => (
						<div
							onClick={() => onClick(Class.name, Class.schoolName)}
							className={styles.class}
							key={Class.schoolName + ' ' + Class.name}
						>
							{highlighter(Class.name)}
						</div>
					))}
				</div>
			</Suspender>

			<Link to={`/pickSchool`} className={styles.pickSchool}>
				Сменить школу
			</Link>
		</div>
	);
};

export default PickClass;
