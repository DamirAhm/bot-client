import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { homework } from '../../../types';

import styles from './ChangeContent.module.css';
import createContentFiller, {
	ContentSectionProps,
} from '../../../utils/createContentChanger/createContentChanger';
import Suspender from '../Suspender/Suspender';
import { useQuery } from '@apollo/react-hooks';
import {
	GET_SCHEDULE,
	GET_LESSONS,
} from '../../Content/ClassPage/Sections/ScheduleSection/ScheduleSection';
import { ChangeContentProps } from './ChangeContent';
import { useParams } from 'react-router-dom';
import { memoize } from '../../../utils/functions';

const DEFAULT_LESSON = 'Выберите предмет';

type changableHomework = Pick<homework, 'lesson' | 'to' | 'attachments' | 'text'>;
type ChangeHomeworkProps = {
	[K in keyof changableHomework]: ContentSectionProps<changableHomework[K]>;
};

const findWeekDaysWithLesson = memoize((schedule: string[][], lesson: string): number[] => {
	return schedule.reduce((acc, c, i) => {
		if (c.includes(lesson)) {
			acc.push(i + 1);
		}
		return acc;
	}, [] as number[]);
});
const shouldBeOutlined = memoize((schedule: string[][], lesson: string, weekDay: number) => {
	return findWeekDaysWithLesson(schedule, lesson).includes(weekDay);
});

const findNextDayWithLesson = (schedule: string[][], lesson: string, currentWeekDay: number) => {
	let lastIndex = -1;
	if (schedule.slice(currentWeekDay).find((e) => e.includes(lesson))) {
		lastIndex =
			schedule.slice(currentWeekDay).findIndex((e) => e.includes(lesson)) +
			currentWeekDay +
			1;
	} else if (schedule.find((e) => e.includes(lesson))) {
		lastIndex = schedule.findIndex((e) => e.includes(lesson)) + 1;
	}
	return lastIndex;
};
const findNextLessonDate = (schedule: string[][], lesson: string, initDate = new Date()) => {
	const nextLessonWeekDay = findNextDayWithLesson(schedule, lesson, initDate.getDay());

	if (nextLessonWeekDay <= 7 && nextLessonWeekDay !== -1) {
		const weekDay = initDate.getDay() || 7; //Чтобы воскресенье было 7 днем недели
		const addition = nextLessonWeekDay <= weekDay ? 7 : 0; //Равно 7 если урок на следующей неделе

		let date = initDate.getDate() + addition - (weekDay - nextLessonWeekDay);
		let month = initDate.getMonth();

		return new Date(initDate.getFullYear(), month, date);
	} else if (nextLessonWeekDay === -1) {
		return null;
	} else {
		throw new TypeError('Week day must be less or equal to 7');
	}
};

const ChangeHomework = createContentFiller<ChangeHomeworkProps>(
	{
		lesson: {
			title: 'Урок',
			ContentComponent: ({ value, changeHandler }) => {
				const { className, schoolName } = useParams<{
					className: string;
					schoolName: string;
				}>();
				const scheduleQuery = useQuery<{ schedule: string[][] }>(GET_SCHEDULE, {
					variables: { className, schoolName },
				});
				const lessonsQuery = useQuery<{ lessons: string[] }>(GET_LESSONS);

				return (
					<Suspender queries={[scheduleQuery, lessonsQuery]}>
						{(
							{ schedule }: { schedule: string[][] },
							{ lessons }: { lessons: string[] },
						) => {
							const possibleLessons = lessons.filter((lesson) =>
								schedule.some((day) => day.includes(lesson)),
							);

							return (
								<select
									className={styles.selectLesson}
									onChange={(e) => changeHandler(e.target.value)}
									value={value}
								>
									{(!value || value === DEFAULT_LESSON) && (
										<option
											key={`possibleLessonNothing`}
											disabled
											value={DEFAULT_LESSON}
										>
											{DEFAULT_LESSON}
										</option>
									)}
									<option value={value}>{value}</option>
									{possibleLessons
										.filter((lesson) => lesson !== value)
										.map((lesson) => (
											<option key={`${lesson}`} value={lesson}>
												{lesson}
											</option>
										))}
								</select>
							);
						}}
					</Suspender>
				);
			},
			defaultValue: 'Выберите предмет',
			validator: (lesson) => {
				if (lesson === '' || lesson === DEFAULT_LESSON) return 'Выберите урок';
			},
		},
		...ChangeContentProps,
		to: {
			title: 'Дата',
			ContentComponent: ({ changeHandler, value, state: { lesson } }) => {
				const { className, schoolName } = useParams<{
					className: string;
					schoolName: string;
				}>();
				const query = useQuery<
					{ schedule: string[][] },
					{ className: string; schoolName: string }
				>(GET_SCHEDULE, { variables: { className, schoolName } });
				const [schedule, setSchedule] = useState<string[][]>();

				useEffect(() => {
					if (query.data?.schedule) setSchedule(query.data.schedule);
				}, [query, query.data]);

				if (!lesson || query.loading) {
					return <ToSection changeHandler={changeHandler} value={value} />;
				} else {
					return (
						<Suspender
							fallback={<ToSection changeHandler={changeHandler} value={value} />}
							query={query}
						>
							<>
								{schedule && (
									<ToSection
										changeHandler={changeHandler}
										value={value}
										renderDayContents={(day, date) => (
											<OutlinedDay
												date={day}
												outlined={shouldBeOutlined(
													schedule,
													lesson,
													date.getDay(),
												)}
											/>
										)}
										nextLessonDate={findNextLessonDate(
											schedule,
											lesson,
											new Date(value),
										)}
									/>
								)}
							</>
						</Suspender>
					);
				}
			},
			defaultValue: new Date().toISOString(),
			validator: (date) => {
				if (+date >= Date.now())
					return 'Дата на которую задано задание должно быть в будущем';
			},
		},
	},
	(state) => {
		if (state.text.trim() === '' && state.attachments.length === 0) {
			return 'Задание должно содержать текст или фотографии';
		}
	},
);

const OutlinedDay: React.FC<{ outlined: boolean; date?: number }> = ({ outlined, date }) => {
	return <span className={outlined ? styles.outlined : ''}>{date}</span>;
};
const ToSection: React.FC<{
	value: string;
	changeHandler: (date: string) => void;
	renderDayContents?: (day: number, date: Date) => JSX.Element;
	nextLessonDate?: Date | null;
}> = ({ value, changeHandler, renderDayContents, nextLessonDate }) => {
	return (
		<div className={styles.toSection}>
			<DatePicker
				selected={new Date(value)}
				onChange={(date) => {
					if (date !== null) {
						changeHandler(date.toISOString());
					}
				}}
				minDate={new Date()}
				dateFormat={'dd/MM/yyyy'}
				className={styles.datePickerInput}
				showPopperArrow={false}
				calendarClassName={styles.datePickerCalendar}
				renderDayContents={renderDayContents}
			/>

			{nextLessonDate && (
				<button
					className={styles.onNextLesson}
					onClick={() => changeHandler(nextLessonDate.toISOString())}
				>
					На следущий урок
				</button>
			)}
		</div>
	);
};

export default ChangeHomework;
