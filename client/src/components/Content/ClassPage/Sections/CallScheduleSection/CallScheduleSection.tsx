import { useQuery } from "@apollo/client";
import { gql } from "apollo-boost";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { lessonCalls, School } from "../../../../../types";
import {
	compareTimes,
	getCallCheduleForDay,
	getLessonAtSpecificTime,
	getTimeFromDate,
} from "../../../../../utils/functions";
import Suspender from "../../../../Common/Suspender/Suspender";
import InfoSection from "../../InfoSection/InfoSection";
import styles from "./CallScheduleSection.module.css";

const Queries = {
	CALL_SCHEDULE: gql`
		query CallSchedule($schoolName: String!) {
			schoolsOne(filter: { name: $schoolName }) {
				callSchedule
			}
		}
	`,
};

const CallScheduleSection: React.FC = ({}) => {
	const { schoolName } = useParams<{ schoolName: string }>();
	const callScheduleQuery = useQuery<{
		schoolsOne: Pick<School, "callSchedule">;
	}>(Queries.CALL_SCHEDULE, {
		variables: { schoolName },
	});

	const [callSchedule, setCallSchedule] = useState<lessonCalls[] | null>(null);
	const [currentLesson, setCurrentLesson] = useState(0);

	useEffect(() => {
		if (callScheduleQuery.data?.schoolsOne) {
			const callScheduleForDay = getCallCheduleForDay(
				callScheduleQuery.data?.schoolsOne.callSchedule,
				new Date().getDay()
			);
			setCallSchedule(callScheduleForDay);
			setCurrentLesson(getLessonAtSpecificTime(callScheduleForDay, new Date()));
		}
	}, [callScheduleQuery]);
	useEffect(() => {
		const interval = setInterval(
			() =>
				callSchedule &&
				setCurrentLesson(getLessonAtSpecificTime(callSchedule, new Date())),
			60 * 1000
		);

		return () => clearInterval(interval);
	}, []);

	const isCurrentLesson = (index: number) => {
		if (callSchedule) {
			const isLessonsContinuing = compareTimes(
				callSchedule[currentLesson].end.padStart(5, "0"),
				getTimeFromDate(new Date())
			);
			return index === currentLesson && isLessonsContinuing;
		}

		return false;
	};

	return (
		<InfoSection name="Расписание звонков">
			<Suspender query={callScheduleQuery}>
				<div className={styles.container}>
					{callSchedule &&
						callSchedule.map((e, i) => (
							<div
								key={e.start}
								className={`${styles.lesson} ${
									isCurrentLesson(i) ? styles.current : ""
								}`}
							>
								{i + 1}){" "}
								<span>
									{e.start} - {e.end}
								</span>
							</div>
						))}
				</div>
			</Suspender>
		</InfoSection>
	);
};

export default CallScheduleSection;
