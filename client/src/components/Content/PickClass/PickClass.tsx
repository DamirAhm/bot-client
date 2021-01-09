import { useMutation, useQuery } from '@apollo/client';
import React, { useContext, useEffect, useState } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { UserContext } from '../../../App';
import useList from '../../../hooks/useList';
import usePolling from '../../../hooks/usePolling';
import { Student, User } from '../../../types';
import { capitalize, changeTitle, highlightSearch, retranslit } from '../../../utils/functions';
import Suspender from '../../Common/Suspender/Suspender';
import Filters from '../../Filters/Filters';
import { classPreview, GET_CLASSES } from '../Classes/Classes';
import ClassCreator from '../Classes/ClassPreview/ClassCreator';
import { GET_STUDENTS_FOR_CLASS } from '../ClassPage/Sections/StudentSection/StudentsSection';
import { CHANGE_CLASS, GET_STUDENT_BY_VK_ID } from '../StudentPage/StudentPage';
import styles from './PickClass.module.css';

type fn<T> = (value: T) => T;

const PickClass: React.FC<{ setUser: (fn: fn<User | null>) => void }> = ({ setUser }) => {
	const { schoolName } = useParams<{ schoolName: string }>();
	const { uid } = useContext(UserContext);
	const { setFilter, items, setItems } = useList<[string, classPreview[]]>([]);
	const history = useHistory();

	const [searchText, setText] = useState('');

	const setSearchText = (str: string) => {
		str = str.toLowerCase().trim();

		const isMatch = (c: [string, classPreview[]], str: string): boolean => {
			return (
				retranslit(c[0]).search(str) !== -1 ||
				c[1].some((classPreview) => classPreview.name.toLowerCase().search(str) !== -1) ||
				(str.split(' ').length > 1 && str.split(' ').every((str) => isMatch(c, str)))
			);
		};

		setText(str);
		setFilter((c) => isMatch(c, str));
	};
	const highlighter = (str: string) => {
		return highlightSearch(str, searchText);
	};

	const classesQuery = useQuery<{ classes: classPreview[] }, { schoolName: string }>(
		GET_CLASSES,
		{
			variables: { schoolName },
		},
	);
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
							history.push(`/${schoolName}/classes/${className}`);
						}
					}
				}
			},
		});
	};

	useEffect(() => {
		if (classesQuery.data?.classes) {
			const parsedClassesBySchool = parseClassesBySchool(classesQuery.data.classes);

			setItems([...parsedClassesBySchool]);
		}
	}, [classesQuery]);
	useEffect(() => {
		changeTitle('Выберите класс');
	});

	usePolling(classesQuery);

	if (schoolName) {
		const [, classes] = items.find(([school]) => schoolName === school) || [];

		if (classes) {
			return (
				<div className="centerer">
					<Suspender query={classesQuery}>
						<div className={styles.container}>
							<span className={styles.title}>В каком классе вы учитесь? 📚</span>
							<Filters
								inputProps={{ className: styles.filterInput }}
								className={styles.filters}
								setSearchText={setSearchText}
							/>
							<ClassCreator schoolName={schoolName} />
							<div className={styles.classes}>
								{classes.map(
									(Class) =>
										Class && (
											<div
												onClick={() =>
													onClick(Class.name, Class.schoolName)
												}
												className={styles.class}
												key={Class.schoolName + ' ' + Class.name}
											>
												{highlighter(Class.name)}
											</div>
										),
								)}
							</div>
						</div>
					</Suspender>

					<Link to={`/pickSchool`} className={styles.pickSchool}>
						Сменить школу
					</Link>
				</div>
			);
		} else {
			return <div>Ошибкa</div>;
		}
	} else {
		return (
			<div className="centerer">
				<Suspender query={classesQuery}>
					<div className={styles.container}>
						<span className={styles.title}>В каком классе вы учитесь? 📚</span>
						<Filters
							inputProps={{ className: styles.filterInput }}
							className={styles.filters}
							setSearchText={setSearchText}
						/>
						{items.map(([school, classes]) => (
							<div className={styles.citySchools} key={school}>
								<div className={styles.city}>
									<span>{capitalize(retranslit(school.replace(':', ' ')))} </span>
								</div>
								<ClassCreator schoolName={school} />
								<div className={styles.classes}>
									{classes.map((Class) => (
										<div
											onClick={() => onClick(Class.name, Class.schoolName)}
											className={styles.class}
											key={Class.schoolName + ' ' + Class.name}
										>
											{highlighter(Class.name)}
										</div>
									))}
								</div>
							</div>
						))}
					</div>
				</Suspender>

				<Link to={`/pickSchool`} className={styles.pickSchool}>
					Сменить школу
				</Link>
			</div>
		);
	}
};

const parseClassesBySchool = (classes: classPreview[]) => {
	const parsedClasses = new Map<string, classPreview[]>();

	for (const Class of classes) {
		if (parsedClasses.has(Class.schoolName)) {
			parsedClasses.get(Class.schoolName)?.push(Class);
		} else {
			parsedClasses.set(Class.schoolName, [Class]);
		}
	}

	return parsedClasses;
};

export default PickClass;
