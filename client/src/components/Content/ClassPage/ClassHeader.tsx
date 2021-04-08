import { gql, useMutation } from '@apollo/client';
import React, { useContext, useState } from 'react';
import { Redirect, useHistory, useParams } from 'react-router-dom';
import { UserContext } from '../../../App';
import { Student, Class, redactorOptions, WithTypename } from '../../../types';
import Confirm from '../../Common/Confirm/Confirm';
import Options from '../../Common/Options/Options';
import { classPreview, GET_CLASSES } from '../Classes/Classes';
import { getSchoolNumber } from '../PickClass/PickSchool';
import { studentPreview } from '../Students/Students';
import styles from './ClassPage.module.css';
import {
	REMOVE_STUDENT_FROM_CLASS,
	GET_STUDENTS_FOR_CLASS,
} from './Sections/StudentSection/StudentsSection';

const REMOVE_CLASS = gql`
	mutation RemoveClass($className: String!, $schoolName: String!) {
		classRemoveOne(className: $className, schoolName: $schoolName) {
			name
			schoolName
		}
	}
`;

type Props = {};

const ClassHeader: React.FC<Props> = ({}) => {
	const { className, schoolName } = useParams<{ className: string; schoolName: string }>();
	const { uid, className: userClassName, setUser } = useContext(UserContext);
	const history = useHistory();

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
						user ? { ...user, className: undefined, schoolName: undefined } : null,
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

	return (
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
					className={`remove ${styles.button}`}
					style={{ cursor: 'pointer' }}
					size={30}
				/>
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
		</div>
	);
};

export default ClassHeader;
