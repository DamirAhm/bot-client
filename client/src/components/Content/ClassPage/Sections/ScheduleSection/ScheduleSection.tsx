import styles from './ScheduleSection.module.css';
import { isOptionType, optionType, redactorOptions, WithTypename } from '../../../../../types';

import React, { useState, memo, useEffect, useCallback, MutableRefObject } from 'react';
import { gql } from '@apollo/client';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { MdClose } from 'react-icons/md';
import {
	DragDropContext,
	DropResult,
	OnDragEndResponder,
	OnDragStartResponder,
} from 'react-beautiful-dnd';
import { DraggableEntity, DroppableEntity } from '../../../../Common/DragAndDropEntities';
import { useParams } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import { ActionMeta, StylesConfig, Theme, ValueType } from 'react-select';

import Options from '../../../../Common/Options/Options';
import InfoSection from '../../InfoSection/InfoSection';
import Suspender from '../../../../Common/Suspender/Suspender';

import usePolling from '../../../../../hooks/usePolling';
import { useRef } from 'react';

const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

const FIVE_MINS = 1000 * 60 * 5;

export const GET_SCHEDULE = gql`
	query GetSchedule($className: String!, $schoolName: String!) {
		schedule: getSchedule(className: $className, schoolName: $schoolName)
	}
`;
export const GET_LESSONS = gql`
	query GetLessons {
		lessons: getLessons
	}
`;

const Queries = {
	GET_SCHEDULE,
	GET_LESSONS,
};
const Mutations = {
	CHANGE_SCHEDULE: gql`
		mutation ChangeDay(
			$className: String!
			$dayIndex: Int!
			$newDay: [String]!
			$schoolName: String!
		) {
			changed: changeDay(
				className: $className
				dayIndex: $dayIndex
				newSchedule: $newDay
				schoolName: $schoolName
			)
		}
	`,
};
const Subscriptions = {
	ON_SCHEDULE_CHANGED: gql`
		subscription OnScheduleChanged($className: String!, $schoolName: String!) {
			onScheduleChanged(className: $className, schoolName: $schoolName) {
				newSchedule
				dayIndex
			}
		}
	`,
};

type scheduleData = {
	schedule: string[][] | null;
	lessonsList: string[] | null;
	initialSchedule: string[][] | null;
};

const ScheduleSection: React.FC<{}> = ({}) => {
	const { schoolName, className } = useParams<{ schoolName: string; className: string }>();
	const [isAnyLessonDragging, setIsAnyLessonDragging] = useState(false);
	const [scheduleData, setScheduleData] = useState<Partial<scheduleData> | null>(null);

	const scheduleQuery = useQuery<
		{ schedule: string[][] },
		{ schoolName: string; className: string }
	>(Queries.GET_SCHEDULE, {
		variables: { className, schoolName },
	});
	useSubscription<{ onScheduleChanged: { dayIndex: number; newSchedule: string[] } }>(
		Subscriptions.ON_SCHEDULE_CHANGED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const scheduleChange = subscriptionData.data?.onScheduleChanged;

				if (scheduleChange && !isAnyLessonDragging) {
					scheduleQuery.updateQuery((prev) => {
						return {
							schedule: prev.schedule.map((day, i) =>
								i === scheduleChange.dayIndex ? scheduleChange.newSchedule : day,
							),
						};
					});
				}
			},
		},
	);

	usePolling(scheduleQuery, FIVE_MINS);

	const lessonsQuery = useQuery<{ lessons: string[] }>(Queries.GET_LESSONS);

	const [changeDay] = useMutation<
		WithTypename<{ changed: string[] }>,
		{ className: string; dayIndex: number; newDay: string[]; schoolName: string }
	>(Mutations.CHANGE_SCHEDULE);
	const changeSchedule = useCallback(
		(changes: string[], dayIndex: number) => {
			changeDay({
				variables: { className, dayIndex, newDay: changes, schoolName },
				optimisticResponse: {
					__typename: 'Mutation',
					changed: changes,
				},
				update: (proxy, { data }) => {
					const query = proxy.readQuery<{ schedule: string[][] }>({
						query: Queries.GET_SCHEDULE,
						variables: { className, schoolName },
					});

					if (query?.schedule && data?.changed) {
						proxy.writeQuery<{ schedule: string[][] }>({
							query: Queries.GET_SCHEDULE,
							variables: { className, schoolName },
							data: {
								schedule: query.schedule.map((day, index) =>
									index === dayIndex ? data?.changed : day,
								),
							},
						});
					}
				},
			});
		},
		[className, scheduleQuery, schoolName],
	);

	const onDragStart: OnDragStartResponder = () => {
		setIsAnyLessonDragging(true);
	};
	const onDragEnd: OnDragEndResponder = (initial) => {
		const schedule = scheduleData?.schedule;
		if (schedule) {
			const { destination, source } = initial;

			if (destination && source) {
				let newSchedule = [...schedule];

				let lesson = newSchedule[+source.droppableId][source.index];
				//Removes lesson from previous position
				newSchedule[+source.droppableId] = newSchedule[+source.droppableId].filter(
					(_, i) => i != source.index,
				);

				//appends lesson after element at source index
				newSchedule[+destination.droppableId].splice(destination.index, 0, lesson);

				setScheduleData({
					lessonsList: scheduleData?.lessonsList,
					schedule: newSchedule,
					initialSchedule: scheduleData?.initialSchedule,
				});
			}
		}

		setIsAnyLessonDragging(false);
	};

	useEffect(() => {
		const newScheduleData: Partial<scheduleData> = {};
		if (scheduleQuery.data?.schedule) {
			newScheduleData.schedule = scheduleQuery.data.schedule;
			newScheduleData.initialSchedule = Array.from(scheduleQuery.data.schedule, (el) =>
				Array.from(el),
			);
		}
		if (lessonsQuery.data) {
			newScheduleData.lessonsList = lessonsQuery.data.lessons;
		}

		setScheduleData(newScheduleData);
	}, [scheduleQuery, lessonsQuery]);

	const lessonsList = useRef([
		...new Set([
			...(scheduleData?.lessonsList || []),
			...(scheduleData?.schedule || []).flat(2),
		]),
	]);
	useEffect(() => {
		lessonsList.current = [
			...new Set([
				...(scheduleData?.lessonsList || []),
				...(scheduleData?.schedule || []).flat(2),
			]),
		];
	}, [scheduleData]);

	return (
		<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
			<InfoSection name={'Расписание'}>
				<Suspender queries={[scheduleQuery, lessonsQuery]}>
					{scheduleDataExists(scheduleData) && (
						<div className={styles.days}>
							{scheduleData.schedule.map((day, i) => (
								<ScheduleDay
									changeDay={changeSchedule}
									lessonsList={lessonsList}
									key={'day' + i}
									index={i}
									isAnyLessonDragging={isAnyLessonDragging}
									lessons={day}
									initialLessons={scheduleData.initialSchedule[i]}
								/>
							))}
						</div>
					)}
				</Suspender>
			</InfoSection>
		</DragDropContext>
	);
};

type ScheduleDayProps = {
	index: number;
	lessons: string[];
	initialLessons: string[];
	lessonsList: MutableRefObject<string[]>;
	changeDay: (changes: string[], dayIndex: number) => void;
	isAnyLessonDragging: boolean;
};

const ScheduleDay: React.FC<ScheduleDayProps> = memo(
	({ index, lessons, lessonsList, changeDay, isAnyLessonDragging, initialLessons }) => {
		const [changing, setChanging] = useState(false);
		const [changes, setChanges] = useState(lessons);

		const iconSize = 15;

		useEffect(() => {
			setChanges(lessons);
		}, [lessons]);

		const reject = () => {
			setChanging(false);
			setChanges(initialLessons);
		};
		const confirm = () => {
			setChanging(false);
			changeDay(changes, index);
		};

		const changeHandler = useCallback(
			(index: number, value: string) => {
				const newChanges = [...changes];
				newChanges[index] = value;
				setChanges(newChanges);
			},
			[changes],
		);

		const removeLesson = useCallback(
			(index: number) => {
				setChanges(changes.filter((_, i) => i !== index));
			},
			[changes],
		);
		const addLesson = useCallback(() => {
			setChanges(changes.concat([changes[changes.length - 1] || lessonsList.current[0]]));
		}, [changes, lessonsList]);

		const newLessonsList = useRef([...new Set([...lessonsList.current, ...changes])]);
		useEffect(() => {
			newLessonsList.current = [...new Set([...lessonsList.current, ...changes])];
		}, [changes]);

		return (
			<DroppableEntity
				className={styles.droppableDay}
				droppableId={String(index)}
				isDropDisabled={!changing}
			>
				<div className={styles.day} onDoubleClick={() => setChanging(true)}>
					<div
						className={`${styles.lessons} ${
							changing && isAnyLessonDragging ? styles.lessonDraging : ''
						}`}
					>
						<div
							className={`${styles.dayName} ${
								new Date().getDay() === index + 1 ? styles.currentDay : ''
							}`}
							onClick={() => setChanging(true)}
						>
							{days[index]}
						</div>
						{
							//@ts-ignore
							changes.map((lesson, i) => (
								<Lesson
									changing={changing}
									key={days[index] + lesson + i}
									dayIndex={index}
									index={i}
									removeLesson={removeLesson}
									changeHandler={changeHandler}
									lesson={lesson}
									lessonsList={newLessonsList}
								/>
							))
						}
						{/*//? In different element because confirm and reject should be on the bottom of component */}
						{changing && !isAnyLessonDragging && (
							<button className={styles.addLesson} onClick={addLesson}>
								Добавить урок
							</button>
						)}
					</div>
					{!changing ? (
						<Options
							include={redactorOptions.change}
							props={{
								className: styles.pen,
								size: iconSize,
								onClick: () => setChanging(true),
								allowOnlyRedactor: true,
							}}
						/>
					) : (
						<div className={styles.changers}>
							{!isAnyLessonDragging && (
								<Options
									include={[redactorOptions.reject, redactorOptions.confirm]}
									props={{
										[redactorOptions.reject]: {
											onClick: reject,
											className: `remove ${styles.changer}`,
										},
										[redactorOptions.confirm]: {
											onClick: confirm,
											className: `confirm ${styles.changer}`,
											allowOnlyRedactor: true,
										},
									}}
									size={iconSize + 5}
								/>
							)}
						</div>
					)}
				</div>
			</DroppableEntity>
		);
	},
);

type LessonProps = {
	changing: boolean;
	dayIndex: number;
	lesson: string;
	index: number;
	changeHandler: (index: number, value: string) => void;
	lessonsList: MutableRefObject<string[]>;
	removeLesson: (index: number) => void;
};

const lessonSelectStyle: StylesConfig<optionType, false> = {
	menu: (provided) => ({
		...provided,
		width: '170px',
		minWidth: '50px',
		maxWidth: '300px',
		wordBreak: 'break-all',
	}),
	control: (provided) => ({
		...provided,
		fontSize: '1.2rem',
		padding: 0,
		minHeight: '1rem',
	}),
	dropdownIndicator: (provided) => ({
		...provided,
		padding: '0 5px',
	}),
	valueContainer: (provided) => ({
		...provided,
		padding: '0 5px',
	}),
	input: (provided) => ({
		...provided,
		maxWidth: '100px',
	}),
};
export const getSelectTheme = (theme: Theme) => ({
	...theme,
	colors: {
		...theme.colors,
		neutral0: 'var(--accent)',
		primary: 'var(--main)',
		primary25: 'var(--main-lighten)',
		neutral50: 'var(--main)',
	},
});

const Lesson: React.FC<LessonProps> = memo(
	({ changing, dayIndex, lesson, index, changeHandler, lessonsList, removeLesson }) => {
		const lessonChangeHandler = (
			value: ValueType<optionType, false>,
			meta: ActionMeta<optionType>,
		) => {
			if (['create-option', 'select-option'].includes(meta.action) && isOptionType(value)) {
				changeHandler(index, value.value);
			}
		};

		const lessonOptions = lessonsList.current.map((les) => ({ value: les, label: les }));

		if (!lessonOptions.find(({ value }) => value === lesson)) {
			lessonOptions.push({ value: lesson, label: lesson });
		}

		return (
			<DraggableEntity
				draggableId={String(dayIndex) + String(index)}
				className={`${styles.lesson} ${changing ? styles.changingLesson : ''}`}
				index={index}
				isDragDisabled={!changing}
			>
				{!changing ? (
					<span key={dayIndex + lesson + index}>
						{index + 1}) {lesson}
					</span>
				) : (
					<div className={styles.lessonChange} key={`picker${dayIndex + lesson + index}`}>
						<CreatableSelect
							options={lessonOptions}
							defaultValue={lessonOptions.find(({ value }) => value === lesson)}
							onChange={lessonChangeHandler}
							className={styles.selectLesson}
							theme={getSelectTheme}
							formatCreateLabel={(str: string) => <span>Создать {str}</span>}
							styles={lessonSelectStyle}
						/>
						<button className={styles.removeLesson} onClick={() => removeLesson(index)}>
							<MdClose className={'remove '} size={20} />
						</button>
					</div>
				)}
			</DraggableEntity>
		);
	},
);

export default ScheduleSection;

function scheduleDataExists(
	data: Partial<scheduleData> | null,
): data is { schedule: string[][]; lessonsList: string[]; initialSchedule: string[][] } {
	return (
		!!data &&
		data.schedule !== undefined &&
		data.initialSchedule !== undefined &&
		data.lessonsList !== undefined &&
		data.schedule !== null &&
		data.initialSchedule !== null &&
		data.lessonsList !== null
	);
}
