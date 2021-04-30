import React, { useEffect, useState } from "react";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client";
import ClassPreview from "./ClassPreview/ClassPreview";
import styles from "./Classes.module.css";
import ClassCreator from "./ClassPreview/ClassCreator";
import Filters from "../../Filters/Filters";
import { sort } from "../Students/Students";
import useList from "../../../hooks/useList";
import Suspender from "../../Common/Suspender/Suspender";
import { changeTitle } from "../../../utils/functions";
import { useParams } from "react-router-dom";
import usePolling from "../../../hooks/usePolling";

export const GET_CLASSES = gql`
	query GetClasses($schoolName: String) {
		classes: classesForSchool(schoolName: $schoolName) {
			studentsCount
			name
			schoolName
			_id
			__typename
		}
	}
`;

export type classesData = {
	classes: classPreview[];
};

export type classPreview = {
	studentsCount: number;
	name: string;
	schoolName?: string;
	_id: string;
};

const Classes: React.FC = () => {
	const { schoolName } = useParams<{ schoolName: string }>();
	const query = useQuery<classesData, { schoolName: string }>(GET_CLASSES, {
		variables: { schoolName },
	});

	const { items, setFilter, setSort, setItems } = useList<classPreview>([]);
	const [searchText, setText] = useState("");
	const sorts: sort[] = [
		{
			name: "Кол-ву учеников",
			sort: (a: classPreview, b: classPreview) =>
				a.studentsCount > b.studentsCount ? -1 : 1,
		},
		{
			name: "Имени",
			sort: (a: classPreview, b: classPreview) => (a.name > b.name ? 1 : -1),
		},
	];

	const setSearchText = (str: string) => {
		str = str.toLowerCase();
		setText(str);
		setFilter(
			(c: classPreview) =>
				c.name.toLowerCase().search(str) !== -1 ||
				c.studentsCount.toString().toLowerCase().search(str) !== -1
		);
	};

	const setSorting = (name: string) => {
		const sort = sorts.find(sort => sort.name === name)?.sort;
		if (sort) {
			setSort(sort);
		} else {
			setSort(() => 1);
		}
	};

	useEffect(() => {
		if (query.data?.classes) {
			setItems(query.data.classes);
		}
	}, [query, setItems]);

	useEffect(() => {
		changeTitle("Классы");
	}, []);

	usePolling(query);

	return (
		<>
			<Filters
				className={styles.filters}
				setSearchText={setSearchText}
				sortsList={sorts}
				setSort={setSorting}
			/>
			<div className={styles.classCreator}>
				<ClassCreator schoolName={schoolName} />
			</div>
			<Suspender query={query}>
				<div className={styles.classes}>
					{items.map(c => (
						<ClassPreview
							searchText={searchText}
							key={c.name}
							className={c.name}
							studentsCount={c.studentsCount}
						/>
					))}
				</div>
			</Suspender>
		</>
	);
};

export default Classes;
