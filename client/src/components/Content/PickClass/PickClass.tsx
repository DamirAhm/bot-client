import { useApolloClient, useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import React, { useContext, useEffect } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';
import { UserContext } from '../../../App';
import { Student, User } from '../../../types';
import { changeTitle } from '../../../utils/functions';
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
		{ vkId: number; className: string; schoolName: string }
	>(CHANGE_CLASS);
	const ApolloClient = useApolloClient();

	const { uid } = useContext(UserContext);
	const AC = useApolloClient();

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
		changeTitle('Выберите школу');
	});

	return (
		<>
			<Suspender query={query}>
				{(data?: { classes?: classPreview[] }) => {
					if (data?.classes) {
						return (
							<div className={styles.container}>
								<span className={styles.title}>В каком классе вы учитесь? 📚</span>
								{data.classes.map((Class) => (
									<div
										onClick={() => onClick(Class.name, Class.schoolName)}
										className={styles.class}
										key={Class.schoolName + ' ' + Class.name}
									>
										{Class.name}
									</div>
								))}
							</div>
						);
					} else {
						return <div> Простите похоже у вас не получится выбрать класс 😕 </div>;
					}
				}}
			</Suspender>

			<Link to={`/pickSchool`} className={styles.pickSchool}>
				Сменить школу
			</Link>
		</>
	);
};

export default PickClass;
