import React, { useContext, useEffect } from 'react';
import styles from './ClassPage.module.css';
import ScheduleSection from './Sections/ScheduleSection/ScheduleSection';
import HomeworkSection from './Sections/HomeworkSection/HomeworkSection';
import AnnouncementsSection from './Sections/ChangesSection/AnnouncementsSection';
import { gql } from '@apollo/client';
import { useQuery } from '@apollo/client';
import { Class, roles } from '../../../types';
import { useParams } from 'react-router-dom';
import Suspender from '../../Common/Suspender/Suspender';
import { RedirectTo404 } from '../404/404';
import { changeTitle } from '../../../utils/functions';
import usePolling from '../../../hooks/usePolling';
import ClassHeader from './ClassHeader';
import StudentsSection from './Sections/StudentSection/StudentsSection';
import { UserContext } from '../../../App';
import CallScheduleSection from './Sections/CallScheduleSection/CallScheduleSection';

const GET_CLASS = gql`
	query GetClass($className: String!, $schoolName: String!) {
		classOne(filter: { name: $className, schoolName: $schoolName }) {
			_id
		}
	}
`;

const ClassPage: React.FC = () => {
	const { className, schoolName } = useParams<{ className: string; schoolName: string }>();
	const { role } = useContext(UserContext);

	const query = useQuery<{ classOne: Class | null }, { className: string; schoolName: string }>(
		GET_CLASS,
		{
			variables: { className, schoolName },
		},
	);

	useEffect(() => {
		changeTitle(`${className} класс`);
	}, []);

	usePolling(query);

	return (
		<>
			<Suspender query={query}>
				{({ classOne }: { classOne: Class | null }) =>
					classOne ? (
						<>
							<div className={styles.class}>
								<ClassHeader />
								<div className={styles.content}>
									{[roles.contributor, roles.admin].includes(role) && (
										<StudentsSection />
									)}
									<ScheduleSection />
									<CallScheduleSection />
									<HomeworkSection />
									<AnnouncementsSection />
								</div>
							</div>
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
