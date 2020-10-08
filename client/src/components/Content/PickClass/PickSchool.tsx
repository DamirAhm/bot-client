import { useQuery } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
import React from 'react';
import { useParams, useHistory, Link } from 'react-router-dom';
import { capitalize, retranslit } from '../../../utils/functions';
import Suspender from '../../Common/Suspender/Suspender';
import styles from './PickClass.module.css';

export const GET_SCHOOLS_NAMES = gql`
	query GetSchoolsNames {
		schools: schoolMany {
			name
		}
	}
`;

export const parseSchoolName = (schoolName: string) => {
	const [city, number] = schoolName.split(':');

	return { city, number };
};
export const getCity = (schoolName: string) => {
	return parseSchoolName(schoolName).city;
};
export const getSchoolNumber = (schoolName: string) => {
	return parseSchoolName(schoolName).number;
};

export const parseSchoolsByCity = (schools: string[]): { [city: string]: string[] } => {
	return schools.reduce((acc, schoolName) => {
		const city = getCity(schoolName);
		const number = getSchoolNumber(schoolName);

		if (acc[city]) {
			return { ...acc, [city]: acc[city].concat([number]) };
		} else {
			return { ...acc, [city]: [number] };
		}
	}, {} as { [city: string]: string[] });
};

const PickSchool: React.FC<{}> = ({}) => {
	const query = useQuery<{ schools: { name: string }[] }>(GET_SCHOOLS_NAMES);

	return (
		<>
			<Suspender query={query}>
				{(data?: { schools?: { name: string }[] }) => {
					if (data?.schools) {
						const parsedSchools = parseSchoolsByCity(
							data.schools.map(({ name }) => name),
						);

						return (
							<div className={styles.container}>
								<span className={styles.title}>В какой школе вы учитесь? 🏫</span>
								{Object.keys(parsedSchools)
									.sort()
									.map((city) => (
										<div className={styles.citySchools} key={city}>
											<span className={styles.city}>
												{capitalize(retranslit(city))}
											</span>
											<div className={styles.schools}>
												{parsedSchools[city].map((number) => (
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
						);
					} else {
						return <div> Простите похоже у вас не получится выбрать школу 😕 </div>;
					}
				}}
			</Suspender>
		</>
	);
};

export default PickSchool;
