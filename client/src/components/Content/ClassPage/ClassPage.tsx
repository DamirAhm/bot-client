import React, { useContext, useEffect, useState } from 'react';
import styles from './ClassPage.module.css';
import StudentsSection, {
	GET_STUDENTS_FOR_CLASS,
	REMOVE_STUDENT_FROM_CLASS,
} from './Sections/StudentSection/StudentsSection';
import ScheduleSection from './Sections/ScheduleSection/ScheduleSection';
import HomeworkSection from './Sections/HomeworkSection/HomeworkSection';
import AnnouncementsSection from './Sections/ChangesSection/AnnouncementsSection';
import { gql } from 'apollo-boost';
import { useMutation, useQuery } from '@apollo/react-hooks';
import { WithTypename, Class, redactorOptions, Student } from '../../../types';
import { classPreview, GET_CLASSES } from '../Classes/Classes';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import Options from '../../Common/Options/Options';
import Confirm from '../../Common/Confirm/Confirm';
import Suspender from '../../Common/Suspender/Suspender';
import { RedirectTo404 } from '../404/404';
import { UserContext } from '../../../App';
import { studentPreview } from '../Students/Students';
import { changeTitle, parseSchoolName } from '../../../utils/functions';
import { getSchoolNumber } from '../PickClass/PickSchool';

const REMOVE_CLASS = gql`
	mutation RemoveClass($className: String!, $schoolName: String!) {
		classRemoveOne(className: $className, schoolName: $schoolName) {
			name
			schoolName
		}
	}
`;
const GET_CLASS = gql`
	query GetClass($className: String!, $schoolName: String!) {
		classOne(filter: { name: $className, schoolName: $schoolName }) {
			_id
		}
	}
`;

const ClassPage: React.FC = () => {
	const { className, schoolName } = useParams<{ className: string; schoolName: string }>();

	const { uid, className: userClassName, setUser } = useContext(UserContext);
	const history = useHistory();

	const query = useQuery<{ classOne: Class | null }, { className: string; schoolName: string }>(
		GET_CLASS,
		{
			variables: { className, schoolName },
		},
	);
	const [removeClass] = useMutation<
		WithTypename<{ classRemoveOne: WithTypename<{ name: string; schoolName: string }> }>,
		{ className: string; schoolName: string }
	>(REMOVE_CLASS);

	const [leaveFromClass] = useMutation<{ removed: Student | null }, { vkId: number }>(
		REMOVE_STUDENT_FROM_CLASS,
		{
			variables: { vkId: uid },
			update: (proxy, response) => {
				if (response.data?.removed !== null) {
					try {
						const classesQuery = proxy.readQuery<
							{ classes?: classPreview[] },
							{ schoolName: string }
						>({
							query: GET_CLASSES,
							variables: {
								schoolName,
							},
						});

						if (classesQuery?.classes) {
							proxy.writeQuery<{ classes: classPreview[] | undefined }>({
								query: GET_CLASSES,
								data: {
									classes: classesQuery.classes?.map((Class) =>
										Class.name === className && Class.schoolName === schoolName
											? { ...Class, studentsCount: Class.studentsCount - 1 }
											: Class,
									),
								},
							});
						}
					} catch (e) {}

					try {
						const studentsQuery = proxy.readQuery<
							{ students?: studentPreview[] },
							{ className: string; schoolName: string }
						>({
							query: GET_STUDENTS_FOR_CLASS,
							variables: {
								className,
								schoolName,
							},
						});
						if (studentsQuery?.students) {
							proxy.writeQuery<
								{ students?: studentPreview[] },
								{ className: string; schoolName: string }
							>({
								query: GET_STUDENTS_FOR_CLASS,
								variables: { className, schoolName },
								data: {
									students: studentsQuery.students.filter(
										({ _id }) => _id !== response.data?.removed?._id,
									),
								},
							});
						}
					} catch (e) {}

					setUser((user) =>
						user ? { ...user, className: null, schoolName: null } : null,
					);
					history.push(`/pickClass/${schoolName || ''}`);
				}
			},
		},
	);

	const [waitForConfirm, setWaitForConfirm] = useState(false);

	const remove = () => {
		removeClass({
			variables: { className, schoolName },
			optimisticResponse: {
				classRemoveOne: { name: className, __typename: 'Class', schoolName: schoolName },
				__typename: 'Mutation',
			},
			update: (proxy, res) => {
				const data = proxy.readQuery<{ classes: Class[] }>({ query: GET_CLASSES });

				if (data?.classes && res.data) {
					proxy.writeQuery({
						query: GET_CLASSES,
						data: {
							classes: data?.classes.filter(
								(c) =>
									!(
										c.name === res.data?.classRemoveOne.name &&
										c.name === res.data.classRemoveOne.schoolName
									),
							),
						},
					});

					return <Redirect to={`/${schoolName}/classes`} />;
				}
			},
		});
	};

	useEffect(() => {
		changeTitle(`${className} класс`);
	}, []);

	return (
		<>
			<Suspender query={query} ErrorElement={() => <RedirectTo404 />}>
				{({ classOne }: { classOne: Class | null }) =>
					classOne ? (
						<>
							<div className={styles.class}>
								<div className={styles.header}>
									<div className={styles.className}> {className} </div>
									<div>
										<Options
											include={[redactorOptions.delete, redactorOptions.exit]}
											props={{
												[redactorOptions.delete]: {
													onClick: () => setWaitForConfirm(true),
													allowOnlyAdmin: true,
												},
												[redactorOptions.exit]: {
													onClick: () => leaveFromClass(),
													renderIf: () => className === userClassName,
												},
											}}
											className={'remove'}
											style={{ cursor: 'pointer' }}
											size={30}
										/>
									</div>
								</div>
								<div className={styles.content}>
									<StudentsSection />
									<ScheduleSection />
									<HomeworkSection />
									<AnnouncementsSection />
								</div>
							</div>
							{waitForConfirm && (
								<Confirm
									text={`Вы уверены что хотите удалить ${className} класс ${
										getSchoolNumber(schoolName) + ' школы'
									}? 😕`}
									onConfirm={remove}
									returnRes={() => setWaitForConfirm(false)}
								/>
							)}
						</>
					) : (
						<RedirectTo404 />
					)
				}
			</Suspender>
		</>
	);
};

export default ClassPage;
