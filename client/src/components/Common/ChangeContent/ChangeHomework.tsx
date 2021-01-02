import { homework, isOptionType, optionType } from '../../../types';

import React, { useEffect, useState } from 'react';
import 'react-datepicker/dist/react-datepicker.css';
import DatePicker from 'react-datepicker';
import { useQuery } from '@apollo/react-hooks';
import { useParams } from 'react-router-dom';
import Select, { ActionMeta, OptionsType, StylesConfig, ValueType } from 'react-select';

import styles from './ChangeContent.module.css';
import createContentFiller, {
	ContentSectionProps,
} from '../../../utils/createContentChanger/createContentChanger';
import Suspender from '../Suspender/Suspender';
import {
	GET_SCHEDULE,
	GET_LESSONS,
	getSelectTheme,
} from '../../Content/ClassPage/Sections/ScheduleSection/ScheduleSection';
import { ChangeContentProps } from './ChangeContent';
import { memoize } from '../../../utils/functions';
import usePolling from "../../../hooks/usePolling";

const DEFAULT_LESSON = 'Выберите предмет';

type persistentState = {
	placeholdersCount: number;
};
type changableHomework = Pick<homework, 'lesson' | 'to' | 'attachments' | 'text'>;
type ChangeHomeworkProps = {
	[K in keyof changableHomework]: ContentSectionProps<changableHomework[K], persistentState>;
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

const selectStyles: StylesConfig<optionType, false> = {
	container: (provided) => ({
		...provided,
		fontSize: '1.6rem',
	}),
};

const ChangeHomework = createContentFiller<persistentState, ChangeHomeworkProps>(
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

				const onChange = (value: ValueType<optionType, false>) => {
					if (isOptionType(value)) {
						changeHandler(value.value);
					}
				};

				usePolling([scheduleQuery, lessonsQuery]);

				return (
					<Suspender queries={[scheduleQuery, lessonsQuery]}>
						{(
							{ schedule }: { schedule: string[][] },
							{ lessons }: { lessons: string[] },
						) => {
							const possibleLessons = lessons.filter((lesson) =>
								schedule.some((day) => day.includes(lesson)),
							);
							const lessonOptions = possibleLessons.map((les) => ({
								value: les,
								label: les,
							}));

							console.log(lessonOptions);
							return (
								<Select
									placeholder={'Выбрать'}
									defaultInputValue={value}
									options={lessonOptions}
									styles={selectStyles}
									onChange={onChange}
									theme={getSelectTheme}
								/>
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
		...(ChangeContentProps as any),
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
	{
		placeholdersCount: 0,
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
