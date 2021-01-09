import styles from './StudentSection.module.css';
import { redactorOptions, Student } from '../../../../../types';

import React, { useState, useEffect } from 'react';
import { gql, useQuery, useMutation, useSubscription } from '@apollo/client';
import { useParams } from 'react-router-dom';

import Suspender from '../../../../Common/Suspender/Suspender';
import StudentPreview from '../../../Students/StudentPreview/StudentPreview';
import { studentPreview } from '../../../Students/Students';
import Options from '../../../../Common/Options/Options';
import InfoSection from '../../InfoSection/InfoSection';

import useList from '../../../../../hooks/useList';

export const REMOVE_STUDENT_FROM_CLASS = gql`
	mutation RemoveStudentFromClass($vkId: Int!) {
		removed: removeStudentFromClass(vkId: $vkId)
	}
`;
export const GET_STUDENTS_FOR_CLASS = gql`
	fragment StudentPreview on Student {
		vkId
		role
		className
		fullName
		_id
	}
	query GetStudents($className: String!, $schoolName: String!) {
		students: studentsForClass(className: $className, schoolName: $schoolName) {
			...StudentPreview
		}
	}
`;
export const ADD_STUDENT_TO_CLASS = gql`
	fragment StudentPreview on Student {
		vkId
		className
		role
		fullName
		_id
	}
	mutation AddStudentToClass($vkId: Int!, $className: String!, $schoolName: String!) {
		student: changeClass(vkId: $vkId, newClassName: $className, schoolName: $schoolName) {
			...StudentPreview
		}
	}
`;

const Queries = {
	GET_STUDENTS_FOR_CLASS,
};
const Mutations = {
	REMOVE_STUDENT_FROM_CLASS,
	ADD_STUDENT_TO_CLASS,
};
const Subscriptions = {
	ON_STUDENT_ADDED_TO_CLASS: gql`
		subscription OnStudentAddedToClass($className: String!, $schoolName: String!) {
			onStudentAddedToClass(className: $className, schoolName: $schoolName) {
				student {
					_id
					fullName
					className
					vkId
					role
				}
				className
				schoolName
			}
		}
	`,
	ON_STUDENT_REMOVED_FROM_CLASS: gql`
		subscription OnStudentRemovedFromClass($className: String!, $schoolName: String) {
			onStudentRemovedFromClass(className: $className, schoolName: $schoolName)
		}
	`,
};

const StudentsSection: React.FC<{}> = ({}) => {
	const { className, schoolName } = useParams<{ className: string; schoolName: string }>();

	const studentsQuery = useQuery<
		{ students?: studentPreview[] },
		{ schoolName: string; className: string }
	>(Queries.GET_STUDENTS_FOR_CLASS, { variables: { className, schoolName } });
	const { data, loading, error } = studentsQuery;
	useSubscription<{
		onStudentAddedToClass: { student: Student; className: string; schoolName: string };
	}>(Subscriptions.ON_STUDENT_ADDED_TO_CLASS, {
		variables: { className, schoolName },
		onSubscriptionData: ({ subscriptionData }) => {
			const data = subscriptionData.data?.onStudentAddedToClass;

			if (data?.student !== undefined) {
				studentsQuery.updateQuery((prev) => {
					const students = prev.students?.concat([data.student]) || [];

					const usedVkIds: number[] = [];

					const onlyUniqueStudents = students.filter(({ vkId }) => {
						if (!usedVkIds.includes(vkId)) {
							usedVkIds.push(vkId);
							return true;
						}

						return false;
					});

					return {
						students: onlyUniqueStudents,
					};
				});
			}
		},
	});
	useSubscription<{ onStudentRemovedFromClass: number }>(
		Subscriptions.ON_STUDENT_REMOVED_FROM_CLASS,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const removedVkId = subscriptionData.data?.onStudentRemovedFromClass;

				if (removedVkId !== undefined) {
					studentsQuery.updateQuery((prev) => {
						return {
							students: prev.students?.filter(({ vkId }) => vkId !== removedVkId),
						};
					});
				}
			},
		},
	);

	const [remove] = useMutation<{ removed: number }, { vkId: number }>(
		Mutations.REMOVE_STUDENT_FROM_CLASS,
	);

	const [searchString, setSearchString] = useState('');

	const { items, setFilter, setItems } = useList<studentPreview>([]);

	const removeStudent = (vkId: number) => {
		remove({
			variables: { vkId },
			optimisticResponse: {
				removed: vkId,
			},
			update: (proxy, result) => {
				const data = proxy.readQuery<{ students: studentPreview[] }>({
					query: Queries.GET_STUDENTS_FOR_CLASS,
					variables: { className, schoolName },
				});
				if (data?.students && result.data?.removed != undefined) {
					proxy.writeQuery({
						query: Queries.GET_STUDENTS_FOR_CLASS,
						variables: { className, schoolName },
						data: {
							students: data?.students.filter((e) => e.vkId !== result.data?.removed),
						},
					});
				}
			},
		});
	};

	useEffect(() => {
		console.log(data?.students);
		if (data?.students) setItems(data?.students);
	}, [data, setItems]);

	const changeHandler = (str: string) => {
		str = str.toLowerCase();
		setSearchString(str);
		setFilter(
			(st) =>
				st.fullName?.toLowerCase().search(str) !== -1 ||
				st.role.toLocaleLowerCase().search(str) !== -1,
		);
	};

	return (
		<InfoSection
			name="Ученики"
			defaultSearchString={searchString}
			updateSearchString={changeHandler}
			className={styles.studentsSection}
		>
			<>
				<Suspender query={{ data: items, loading, error }}>
					{(data: Student[]) => (
						<div className={`${styles.students}`}>
							{data.map((e) => (
								<div className={styles.student} key={e.vkId}>
									<StudentPreview
										visibleInfo={['fullName', 'vkId']}
										searchText={searchString}
										{...e}
									/>
									<Options
										include={redactorOptions.reject}
										props={{
											onClick: () => removeStudent(e.vkId),
											size: 30,
											className: `${styles.remove} remove`,
											allowOnlyAdmin: true,
										}}
									/>
								</div>
							))}
						</div>
					)}
				</Suspender>
			</>
		</InfoSection>
	);
};
export default React.memo(StudentsSection);
