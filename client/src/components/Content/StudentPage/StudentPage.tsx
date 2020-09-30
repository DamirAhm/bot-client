import React, { useEffect, useState } from 'react';
import styles from './StudentPage.module.css';
import { gql } from 'apollo-boost';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { redactorOptions, roles, Student, StudentInfoType } from '../../../types';
import StudentInfo from './StudentInfo/StudentInfo';
import { Redirect } from 'react-router';
import { GET_STUDENTS } from '../Students/Students';
import Suspender from '../../Common/Suspender/Suspender';
import { useParams } from 'react-router-dom';
import Options from '../../Common/Options/Options';
import Confirm from '../../Common/Confirm/Confirm';
import { RedirectTo404 } from '../404/404';
import { changeTitle } from '../../../utils/functions';

export const GET_STUDENT_BY_VK_ID = gql`
	query StudentByVkId($vkId: Float!) {
		studentOne(filter: { vkId: $vkId }) {
			vkId
			className
			schoolName
			role
			settings {
				notificationsEnabled
				notificationTime
				daysForNotification
			}
			lastHomeworkCheck
			fullName
			_id
		}
	}
`;
export const GET_CLASS_LIST = gql`
	{
		classMany {
			name
		}
	}
`;
export const UPDATE_STUDENT = gql`
	mutation UpdateStudent($record: UpdateOneStudentInput!, $vkId: Float!) {
		updatedStudent: studentUpdateOne(filter: { vkId: $vkId }, record: $record) {
			record {
				vkId
				className
				role
				settings {
					notificationsEnabled
					notificationTime
					daysForNotification
				}
				lastHomeworkCheck
				fullName
				_id
				__typename
			}
		}
	}
`;
export const CHANGE_CLASS = gql`
	mutation ChangeClass($vkId: Int!, $className: String!) {
		changeClass(vkId: $vkId, newClassName: $className) {
			__typename
			vkId
			_id
			className
		}
	}
`;

export const DELETE_STUDENT = gql`
	mutation DeleteStudent($vkId: Int!) {
		removed: studentRemoveOne(vkId: $vkId) {
			vkId
		}
	}
`;

const StudentPage: React.FC = () => {
	const vkId = Number(useParams<{ vkId: string }>().vkId);
	const [changing, setChanging] = useState(false);
	const [diff, setDiff] = useState<{ [key: string]: any }>({});
	const [removed, setRemoved] = useState(false);
	const [waitForConfirm, setWaitForConfirm] = useState(false);

	const iconSize = 30;

	const { data, loading, error } = useQuery<
		{ studentOne: Student & { __typename: string } },
		{ vkId: number }
	>(GET_STUDENT_BY_VK_ID, { variables: { vkId } });

	const [updater] = useMutation<
		{
			updatedStudent: {
				record: Partial<Student> & { __typename: string };
				__typename: string;
			};
			__typename: string;
		},
		{ record: Partial<Student>; vkId: number }
	>(UPDATE_STUDENT);
	const [changeClass] = useMutation<
		{ changeClass: Partial<Student> & { __typename: string }; __typename: string },
		{ vkId: number; className: string }
	>(CHANGE_CLASS);
	const [deleter] = useMutation<
		{ removed: { vkId: number; __typename: string }; __typename: string },
		{ vkId: number }
	>(DELETE_STUDENT);

	const deleteStudent = () => {
		deleter({
			variables: {
				vkId,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				removed: {
					vkId,
					__typename: 'Student',
				},
			},
			update: (proxy, response) => {
				const data = proxy.readQuery<{ students: Student[] }>({ query: GET_STUDENTS });

				proxy.writeQuery({
					query: GET_STUDENTS,
					data: {
						students: data?.students.filter(
							(s) => s.vkId !== response?.data?.removed.vkId,
						),
					},
				});
				//TODO почему появляются ошибки
				setRemoved(true);
			},
		});
	};

	const changeHandler = (
		path: string,
		value: boolean | string | number | number[] | string[],
	) => {
		if (path.search('.') !== -1) {
			const poles = path.split('.');
			const diffClone: { [key: string]: any } = { ...diff };
			let buffer: { [key: string]: any } = diffClone;
			for (const pole of poles.slice(0, poles.length - 1)) {
				if (buffer[pole]) {
					buffer = buffer[pole];
				} else {
					buffer[pole] = {};
					buffer = buffer[pole];
				}
			}
			buffer[poles[poles.length - 1]] = value;

			setDiff({ ...diffClone });
		} else {
			setDiff({ ...diff, [path]: value });
		}
	};

	const updateStudent = () => {
		if (diff.className) {
			const { className } = diff;
			if (typeof className === 'string') {
				changeClass({
					variables: { className, vkId },
					optimisticResponse: {
						changeClass: { vkId, __typename: 'Student', className: className },
						__typename: 'Mutation',
					},
				});
				delete diff.className;
			}
		}
		if (diff.settings?.notificationTime) {
			const [f, s] = diff.settings?.notificationTime
				.split(':')
				.map(Number)
				.filter(Number.isInteger);

			if (f !== undefined && s !== undefined) {
				if (!(f >= 0 && f <= 23) || !(s >= 0 && s <= 59)) {
					delete diff.settings.notificationTime;
				}
			} else {
				delete diff.settings.notificationTime;
			}
		}
		if (diff.lastHomeworkCheck) {
			if (!Date.parse(diff.lastHomeworkCheck)) {
				delete diff.lastHomeworkCheck;
			}
		}
		if (Object.getOwnPropertyNames(diff).length) {
			const settings = diff.settings;

			updater({
				variables: { vkId, record: { ...diff, settings } },
				optimisticResponse: {
					__typename: 'Mutation',
					updatedStudent: {
						record: {
							__typename: 'Student',
							vkId,
							...data?.studentOne,
							...diff,
							settings: {
								...data?.studentOne.settings,
								...settings,
							},
						},
						__typename: 'UpdateStudent',
					},
				},
			});
		}

		setDiff({});
	};

	useEffect(() => {
		if (data?.studentOne.fullName) {
			changeTitle(data?.studentOne.fullName);
		} else {
			changeTitle('Ученик');
		}
	}, [data]);
	if (removed) {
		return <Redirect to={`/students/`} />;
	}

	return (
		<>
			<Suspender query={{ data, loading, error }}>
				{({ studentOne }: { studentOne?: Student & { __typename: string } }) => {
					if (studentOne) {
						const { fullName, __typename, _id, ...info } = studentOne;

						return (
							<div className={styles.student}>
								<div className={styles.header}>
									<div className={styles.info}>
										<div className={styles.name}> {fullName} </div>
									</div>
								</div>
								<div className={styles.body}>
									{Object.entries(info).map((entrie) => (
										<StudentInfo
											name={
												entrie[0] as
													| keyof StudentInfoType
													| keyof StudentInfoType['settings']
											}
											value={
												info.vkId === 354983196 && entrie[0] === 'role'
													? 'Ubermensch'
													: diff[entrie[0]] &&
													  typeof diff[entrie[0]] !== 'object'
													? diff[entrie[0]]
													: entrie[1]
											}
											isChanging={changing}
											key={`${entrie[0]}`}
											changeHandler={changeHandler}
										/>
									))}
								</div>
								<div className={styles.icons}>
									<Options
										include={
											changing
												? [redactorOptions.reject, redactorOptions.confirm]
												: [redactorOptions.change, redactorOptions.delete]
										}
										props={{
											[redactorOptions.reject]: {
												className: styles.icon + ' negative',
												onClick: () => {
													setDiff({});
													setChanging(false);
												},
											},
											[redactorOptions.confirm]: {
												className: styles.icon + ' positive',
												onClick: () => {
													updateStudent();
													setChanging(false);
												},
												allowOnlyAdmin: true,
											},
											[redactorOptions.change]: {
												onClick: () => setChanging(true),
												className: `${styles.icon} ${styles.pen}`,
												size: iconSize * 0.64,
												allowOnlyAdmin: true,
											},
											[redactorOptions.delete]: {
												onClick: () => setWaitForConfirm(true),
												className: `${styles.icon} remove`,
												allowOnlyAdmin: true,
											},
										}}
										size={iconSize}
									/>
								</div>
							</div>
						);
					} else {
						return <RedirectTo404 />;
					}
				}}
			</Suspender>
			{waitForConfirm && (
				<Confirm
					text={`Вы уверены что хотите удалить ученика`}
					onConfirm={() => deleteStudent()}
					returnRes={() => setWaitForConfirm(false)}
				/>
			)}
		</>
	);
};

export default StudentPage;
