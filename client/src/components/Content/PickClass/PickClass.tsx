import { useApolloClient, useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import React, { useContext } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { UserContext } from '../../../App';
import { Student, User } from '../../../types';
import Suspender from '../../Common/Suspender/Suspender';
import { classPreview, GET_CLASSES } from '../Classes/Classes';
import { GET_STUDENTS_FOR_CLASS } from '../ClassPage/Sections/StudentSection/StudentsSection';
import { CHANGE_CLASS, GET_STUDENT_BY_VK_ID } from '../StudentPage/StudentPage';
import { studentPreview } from '../Students/Students';
import styles from './PickClass.module.css';

type fn<T> = (value: T) => T;

const PickClass: React.FC<{ setUser: (fn: fn<User | null>) => void }> = ({ setUser }) => {
	const { schoolName } = useParams<{ schoolName: string }>();
	const query = useQuery<{ classes: classPreview[] }, { schoolName: string }>(GET_CLASSES, {
		variables: { schoolName },
	});
	const [changeClass] = useMutation<
		{
			changeClass: Partial<Student> & { __typename: string };
			__typename: string;
		},
		{ vkId: number; className: string }
	>(CHANGE_CLASS);
	const ApolloClient = useApolloClient();

	const { uid } = useContext(UserContext);
	const history = useHistory();

	const onClick = (className: string) => {
		changeClass({
			variables: {
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
			update: async (proxy, response) => {
				if (response.data) {
					let data;
					try {
						data = proxy.readQuery<{ studentOne: Student }, { vkId: number }>({
							query: GET_STUDENT_BY_VK_ID,
							variables: {
								vkId: uid,
							},
						});
					} catch (e) {
						data = await ApolloClient.query<{ studentOne?: Student }, { vkId: number }>(
							{
								query: GET_STUDENT_BY_VK_ID,
								variables: {
									vkId: uid,
								},
							},
						).then((res) => res.data);

						if (!data.studentOne) {
							return;
						}
					}

					if (data) {
						const { studentOne } = data;

						if (studentOne) {
							proxy.writeQuery<{ studentOne: Student | null }, { vkId: number }>({
								query: GET_STUDENT_BY_VK_ID,
								data: {
									studentOne: { ...studentOne, class: null },
								},
							});

							try {
								const classesQuery = proxy.readQuery<
									{ classes?: classPreview[] },
									{ className: string }
								>({
									query: GET_CLASSES,
									variables: {
										className,
									},
								});
								if (classesQuery?.classes) {
									proxy.writeQuery<{ classes: classPreview[] | undefined }>({
										query: GET_CLASSES,
										data: {
											classes: classesQuery.classes?.map((Class) =>
												Class.name === className
													? {
															...Class,
															studentsCount: Class.studentsCount + 1,
													  }
													: Class,
											),
										},
									});
								}
							} catch (e) {}

							try {
								const studentsQuery = proxy.readQuery<
									{ students?: studentPreview[] },
									{ className: string }
								>({
									query: GET_STUDENTS_FOR_CLASS,
									variables: {
										className,
									},
								});
								if (studentsQuery?.students) {
									proxy.writeQuery<
										{ students?: studentPreview[] },
										{ className: string }
									>({
										query: GET_STUDENTS_FOR_CLASS,
										variables: { className },
										data: {
											students: studentsQuery.students.concat([studentOne]),
										},
									});
								}
							} catch (e) {}

							setUser((user) => (user ? { ...user, ...studentOne } : null));

							history.push(`/classes/${className}`);
						}
					}
				}
			},
		});
	};

	return (
		<Suspender query={query}>
			{(data?: { classes?: classPreview[] }) => {
				if (data?.classes) {
					return (
						<div className={styles.container}>
							<span className={styles.title}>В каком классе вы учитесь? 📚</span>
							{data.classes.map((Class) => (
								<div
									onClick={() => onClick(Class.name)}
									className={styles.class}
									key={Class.name}
								>
									{' '}
									{Class.name}{' '}
								</div>
							))}
						</div>
					);
				} else {
					return <div> Простите похоже у вас не получится выбрать класс 😕 </div>;
				}
			}}
		</Suspender>
	);
};

export default PickClass;
