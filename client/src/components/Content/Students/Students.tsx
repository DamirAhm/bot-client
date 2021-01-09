import React, { useEffect, useState } from 'react';
import styles from './Students.module.css';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { roles } from '../../../types';
import StudentPreview from './StudentPreview/StudentPreview';
import useList from '../../../hooks/useList';
import Filters from '../../Filters/Filters';
import Suspender from '../../Common/Suspender/Suspender';
import { changeTitle } from '../../../utils/functions';
import { RoleNames } from '../StudentPage/StudentInfo/StudentInfo';
import usePolling from '../../../hooks/usePolling';

export const GET_STUDENTS = gql`
	query GetStudents {
		students: studentMany {
			vkId
			className
			role
			fullName
			schoolName
			_id
		}
	}
`;

export type studentPreview = {
	vkId: number;
	className?: string;
	role: roles;
	fullName?: string;
	schoolName: string;
	_id: string;
};

export type sort<T = any> = {
	name: string;
	sort: (a: T, b: T) => number;
};

const Students: React.FC = () => {
	const studentsQuery = useQuery<{ students: studentPreview[] }>(GET_STUDENTS);
	const { data, loading, error } = studentsQuery;
	const { items, setSort, setFilter, setItems } = useList<studentPreview>([]);
	const [text, setText] = useState('');
	const sorts: sort<studentPreview>[] = [
		{
			name: 'Классу',
			sort: ({ className: aName = '' }, { className: bName = '' }) =>
				aName > bName ? 1 : -1,
		},
		{
			name: 'Школе',
			sort: ({ schoolName: aName = '' }, { schoolName: bName = '' }) =>
				aName > bName ? 1 : -1,
		},
		{
			name: 'Роли',
			sort: (a, b) => (a.role > b.role ? 1 : -1),
		},
		{
			name: 'vkId',
			sort: (a, b) => a.vkId - b.vkId,
		},
		{
			name: 'Имени',
			sort: ({ fullName: aName = '' }, { fullName: bName = '' }) => (aName > bName ? 1 : -1),
		},
	];

	const setSearchText = (str: string): void => {
		str = str.toLowerCase();
		setText(str);
		setFilter(({ fullName = '', className = '', role }) => {
			return (
				fullName.toLowerCase().search(str) !== -1 ||
				(className ?? 'Нету').toLowerCase().search(str) !== -1 ||
				RoleNames[role].toLowerCase().search(str) !== -1
			);
		});
	};
	const setSorting = (name: string) => {
		const sort = sorts.find((e) => e.name === name)?.sort;
		if (sort) {
			setSort(sort);
		} else {
			setSort(() => 1);
		}
	};

	useEffect(() => {
		if (data?.students) {
			setItems(data.students);
		}
	}, [data, setItems]);

	useEffect(() => {
		changeTitle('Ученики');
	}, []);

	usePolling(studentsQuery);

	return (
		<div>
			<Filters
				className={styles.filters}
				setSearchText={setSearchText}
				sortsList={sorts}
				setSort={setSorting}
			/>
			<Suspender query={{ data, error, loading }}>
				{() => (
					<div className={styles.students}>
						{items.map((c) => (
							<StudentPreview key={c.vkId} {...c} searchText={text} />
						))}
					</div>
				)}
			</Suspender>
		</div>
	);
};

export default Students;
