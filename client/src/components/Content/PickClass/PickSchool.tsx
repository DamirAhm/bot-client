import { useMutation, useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { redactorOptions, schoolPreview } from '../../../types';
import { capitalize, retranslit, translit } from '../../../utils/functions';
import Options from '../../Common/Options/Options';
import Suspender from '../../Common/Suspender/Suspender';
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

const PickSchool: React.FC<{}> = ({}) => {
	const [creatingCity, setCreatingCity] = useState(false);
	const [parsedSchools, setParsedSchools] = useState<Map<string, string[]>>(new Map());
	const inputRef = useRef<HTMLInputElement>(null);

	const query = useQuery<{ schools: { name: string }[] }>(GET_SCHOOLS_NAMES);
	const [create] = useMutation<{ newSchool: schoolPreview }, { name: string }>(CREATE_SCHOOL);

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
		setParsedSchools(new Map([...parsedSchools.entries(), [translit(city), []]]));
		setCreatingCity(false);
	};

	useEffect(() => {
		if (query.data?.schools) {
			const newParsedSchools = parseSchoolsByCity(query.data.schools.map(({ name }) => name));

			setParsedSchools(newParsedSchools);
		}
	}, [query]);

	return (
		<div className="centerer">
			<Suspender query={query}>
				<div className={styles.container}>
					<div>
						<span className={styles.title}>В какой школе вы учитесь? 🏫</span>
					</div>
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
					{[...parsedSchools.entries()].map(([city, schools]) => (
						<div className={styles.citySchools} key={city}>
							<div className={styles.city}>
								<span>{capitalize(retranslit(city))}</span>
								<Add onClick={() => createSchool(city)} />
							</div>
							<div className={styles.schools}>
								{schools.map((number) => (
									<Link
										to={`/pickClass/${`${city}:${number}`}`}
										className={styles.school}
										key={`${city}:${number}`}
									>
										{number}
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
