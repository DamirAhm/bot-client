import React, { useState, useEffect } from 'react';
import InfoSection from '../../InfoSection/InfoSection';
import Suspender from '../../../../Common/Suspender/Suspender';
import StudentPreview from '../../../Students/StudentPreview/StudentPreview';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import { sort, studentPreview } from '../../../Students/Students';
import { redactorOptions, roles, Student, WithTypename } from '../../../../../types';
import ReactDOM from 'react-dom';
import useList from '../../../../../hooks/useList';
import styles from './StudentSection.module.css';
import Options from '../../../../Common/Options/Options';
import { UserContext } from '../../../../../App';
import { useContext } from 'react';
import Filters from '../../../../Filters/Filters';
import { highlightSearch } from '../../../../../utils/functions';
import { useParams } from 'react-router-dom';
import usePolling from '../../../../../hooks/usePolling';

const modalEl = document.getElementById('chooseStudentModal');

export const REMOVE_STUDENT_FROM_CLASS = gql`
	mutation RemoveStudentFromClass($vkId: Int!) {
		removed: removeStudentFromClass(vkId: $vkId) {
			vkId
			className
			role
			settings {
				notificationsEnabled
				notificationTime
			}
			lastHomeworkCheck
			fullName
			_id
		}
	}
`;
export const GET_STUDENTS_FOR_CLASS = gql`
	fragment StudentPreview on Student {
		vkId
		role
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

const StudentsSection: React.FC<{}> = ({}) => {
	const { className, schoolName } = useParams<{ className: string; schoolName: string }>();

	const studentsQuery = useQuery<
		{ students?: studentPreview[] },
		{ schoolName: string; className: string }
	>(GET_STUDENTS_FOR_CLASS, { variables: { className, schoolName } });
	const { data, loading, error } = studentsQuery;

	const [remove] = useMutation<{ removed: boolean }, { vkId: number }>(REMOVE_STUDENT_FROM_CLASS);

	const [searchString, setSearchString] = useState('');

	const { items, setFilter, setItems } = useList<studentPreview>([]);

	const removeStudent = (vkId: number) => {
		remove({
			variables: { vkId: vkId },
			optimisticResponse: {
				removed: true,
			},
			update: (proxy, result) => {
				const data = proxy.readQuery<{ students: studentPreview[] }>({
					query: GET_STUDENTS_FOR_CLASS,
					variables: { className, schoolName },
				});
				if (data?.students && result.data?.removed) {
					proxy.writeQuery({
						query: GET_STUDENTS_FOR_CLASS,
						variables: { className, schoolName },
						data: {
							students: data?.students.filter((e) => e.vkId !== vkId),
						},
					});
				}
			},
		});
	};

	useEffect(() => {
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

	usePolling(studentsQuery);

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
