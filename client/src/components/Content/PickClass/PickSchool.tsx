import { useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import useList from '../../../hooks/useList';
import { redactorOptions, schoolPreview } from '../../../types';
import {
	capitalize,
	changeTitle,
	highlightSearch,
	retranslit,
	translit,
} from '../../../utils/functions';
import Options from '../../Common/Options/Options';
import Suspender from '../../Common/Suspender/Suspender';
import Filters from '../../Filters/Filters';
import { classPreview } from '../Classes/Classes';
import { sort } from '../Students/Students';
import styles from './PickClass.module.css';

export const GET_SCHOOLS_NAMES = gql`
	query GetSchoolsNames {
		schools: schoolMany {
			_id
			name
		}
	}
`;
export const CREATE_SCHOOL = gql`
	mutation AddSchool($name: String!) {
		newSchool: schoolCreateOne(schoolName: $name) {
			_id
			name
		}
	}
`;

export const parseSchoolName = (schoolName: string) => {
	const [city, number] = schoolName.split(':');

	return { city, number };
};
export const getSchoolCity = (schoolName: string) => {
	return parseSchoolName(schoolName).city;
};
export const getSchoolNumber = (schoolName: string) => {
	return parseSchoolName(schoolName).number;
};
export const parseSchoolsByCity = (schools: string[]): Map<string, string[]> => {
	const parsedSchools = new Map();

	for (const school of schools) {
		const { city, number } = parseSchoolName(school);

		if (parsedSchools.has(city)) {
			parsedSchools.set(city, [...parsedSchools.get(city), number]);
		} else {
			parsedSchools.set(city, [number]);
		}
	}

	return parsedSchools;
};

type cityEntrie = [string, string[]];

const PickSchool: React.FC<{}> = ({}) => {
	const [creatingCity, setCreatingCity] = useState(false);
	const inputRef = useRef<HTMLInputElement>(null);

	const { items, setFilter, setSort, setItems, setMap } = useList<cityEntrie>([]);

	const query = useQuery<{ schools: { name: string }[] }>(GET_SCHOOLS_NAMES);
	const [create] = useMutation<{ newSchool: schoolPreview }, { name: string }>(CREATE_SCHOOL);

	const [searchText, setText] = useState('');

	const setSearchText = (str: string) => {
		str = str.toLowerCase();

		const isMatch = (c: cityEntrie, str: string): boolean =>
			retranslit(c[0]).search(str) !== -1 ||
			c[1].some((number) => number.search(str) !== -1) ||
			(str.split(' ').length > 1 && str.split(' ').some((str) => isMatch(c, str)));

		setText(str);
		setFilter((c) => isMatch(c, str));
		setMap(([_, numbers]) => {
			if (numbers.some((number) => number.search(str) !== -1)) {
				return [_, numbers.filter((number) => number.search(str) !== -1)];
			} else if (
				str
					.split(' ')
					.some((substr) => numbers.some((number) => number.search(substr) !== -1))
			) {
				return [
					_,
					numbers.filter((number) =>
						str.split(' ').some((substr) => number.search(substr) !== -1),
					),
				];
			}
			return [_, numbers];
		});
	};

	const createSchool = (city: string) => {
		const number = prompt('Введите номер школы');

		if (number && number.trim() && !isNaN(+number)) {
			create({
				variables: { name: `${city}:${number}` },
				optimisticResponse: {
					newSchool: {
						_id: Date.now().toString(),
						name: number,
					},
				},
				update: (proxy, response) => {
					if (response.data) {
						const data = proxy.readQuery<{ schools: { name: string }[] }>({
							query: GET_SCHOOLS_NAMES,
						});

						if (data?.schools) {
							proxy.writeQuery<{ schools: { name: string }[] }>({
								query: GET_SCHOOLS_NAMES,
								data: {
									schools: data.schools.concat([response.data.newSchool]),
								},
							});
						}
					}
				},
			});
		} else {
			alert('Номер школы должен быть цифрой');
		}
	};
	const createCity = (city: string) => {
		setItems([...items, [translit(city), []]]);
		setCreatingCity(false);
	};

	const highlighter = (str: string) => {
		return highlightSearch(str, searchText);
	};

	useEffect(() => {
		if (query.data?.schools) {
			const newParsedSchools = parseSchoolsByCity(query.data.schools.map(({ name }) => name));

			setItems([...newParsedSchools.entries()]);
		}
	}, [query]);
	useEffect(() => {
		changeTitle('Выберите школу');
	});

	return (
		<div className="centerer">
			<Suspender query={query}>
				<div className={styles.container}>
					<div>
						<span className={styles.title}>В какой школе вы учитесь? 🏫</span>
					</div>
					<Filters
						inputProps={{ className: styles.filterInput }}
						className={styles.filters}
						setSearchText={setSearchText}
					/>
					<div
						className={`${styles.createCity} ${
							creatingCity ? styles.creatingCity : ''
						}`}
						onClick={() => setCreatingCity(true)}
					>
						{creatingCity ? (
							<input
								autoFocus
								ref={inputRef}
								onKeyDown={(e) => {
									if (e.key === 'Enter' && inputRef.current) {
										createCity(inputRef.current?.value);
									}
								}}
								onBlur={() => setCreatingCity(false)}
							/>
						) : (
							<span> Добавить город </span>
						)}
					</div>
					{items.map(([city, schools]) => (
						<div className={styles.citySchools} key={city}>
							<div className={styles.city}>
								<span>{highlighter(capitalize(retranslit(city)))}</span>
								<Add onClick={() => createSchool(city)} />
							</div>
							<div className={styles.schools}>
								{schools
									.sort((a, b) => +b - +a)
									.map((number) => (
										<Link
											to={`/pickClass/${`${city}:${number}`}`}
											className={styles.school}
											key={`${city}:${number}`}
										>
											{highlighter(number)}
										</Link>
									))}
							</div>
						</div>
					))}
				</div>
			</Suspender>
		</div>
	);
};

const Add: React.FC<{ onClick: (e: React.MouseEvent<SVGElement, MouseEvent>) => void }> = ({
	onClick,
}) => {
	return (
		<Options
			include={redactorOptions.add}
			props={{
				className: styles.add,
				size: 30,
				onClick,
			}}
		/>
	);
};

export default PickSchool;
