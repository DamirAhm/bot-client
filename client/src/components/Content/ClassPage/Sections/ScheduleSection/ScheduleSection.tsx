import React, { useState, memo, ChangeEvent, useEffect, useCallback } from 'react';
import { gql } from 'apollo-boost';
import InfoSection from '../../InfoSection/InfoSection';
import { useQuery, useMutation } from '@apollo/react-hooks';
import Suspender from '../../../../Common/Suspender/Suspender';
import styles from './ScheduleSection.module.css';
import { MdClose } from 'react-icons/md';
import { isOptionType, optionType, redactorOptions, WithTypename } from '../../../../../types';
import Options from '../../../../Common/Options/Options';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { DraggableEntity, DroppableEntity } from '../../../../Common/DragAndDropEntities';
import { useParams } from 'react-router-dom';
import CreatableSelect from 'react-select/creatable';
import { ActionMeta, ActionTypes, StylesConfig, Theme, ValueType } from 'react-select';
import usePolling from '../../../../../hooks/usePolling';

const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

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

const CHANGE_SCHEDULE = gql`
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
		) {
			name
			schedule
			_id
			__typename
		}
	}
`;

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
	>(GET_SCHEDULE, {
		variables: { className, schoolName },
	});
	const lessonsQuery = useQuery<{ lessons: string[] }>(GET_LESSONS);

	const [changeDay] = useMutation<
		WithTypename<{ changed: WithTypename<{ name: string; schedule: string[][] }> }>,
		{ className: string; dayIndex: number; newDay: string[]; schoolName: string }
	>(CHANGE_SCHEDULE);

	const changeSchedule = useCallback(
		(changes: string[], dayIndex: number) => {
			changeDay({
				variables: { className, dayIndex, newDay: changes, schoolName },
				optimisticResponse: {
					__typename: 'Mutation',
					changed: {
						__typename: 'Class',
						name: className,
						schedule: scheduleQuery.data?.schedule.map((day, i) =>
							i === dayIndex ? changes : day,
						) || [[], [], [], [], [], []],
					},
				},
				update: (proxy, { data }) => {
					const query = proxy.readQuery<{ schedule: string[][] }>({
						query: GET_SCHEDULE,
						variables: { className, schoolName },
					});

					if (query?.schedule) {
						proxy.writeQuery({
							query: GET_SCHEDULE,
							variables: { className, schoolName },
							data: {
								schedule: data?.changed.schedule,
							},
						});
					}
				},
			});
		},
		[changeDay, className, scheduleQuery, schoolName],
	);

	const onDragStart = () => {
		setIsAnyLessonDragging(true);
	};
	const onDragEnd = (initial: DropResult) => {
		const schedule = scheduleData?.schedule;
		if (schedule) {
			const { destination, source } = initial;

			if (destination && source) {
				const newSchedule = [...schedule];

				const lesson = newSchedule[+source.droppableId].splice(source.index, 1)[0];

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

	usePolling([scheduleQuery, lessonsQuery]);

	return (
		<DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
			<InfoSection name={'Расписание'}>
				<Suspender queries={[scheduleQuery, lessonsQuery]}>
					{scheduleDataExists(scheduleData) && (
						<div className={styles.days}>
							{scheduleData.schedule.map((day, i) => (
								<ScheduleDay
									changeDay={changeSchedule}
									lessonsList={
										[
											...new Set([
												...scheduleData.lessonsList,
												...scheduleData.schedule.flat(2),
											]),
										] as string[]
									}
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
	lessonsList: string[];
	changeDay: (changes: string[], dayIndex: number) => void;
	isAnyLessonDragging: boolean;
};

const ScheduleDay: React.FC<ScheduleDayProps> = memo(
	({ index, lessons, lessonsList, changeDay, isAnyLessonDragging, initialLessons }) => {
		const [changing, setChanging] = useState(false);
		const [changes, setChanges] = useState(lessons);

		const iconSize = 15;

		const reject = () => {
			setChanging(false);
			setChanges(initialLessons);
		};
		const confirm = () => {
			setChanging(false);
			//TODO add error handling
			changeDay(changes, index);
		};

		const changeHandler = (index: number, value: string) => {
			const newChanges = [...changes];

			newChanges[index] = value;

			setChanges(newChanges);
		};

		const removeLesson = (index: number) => {
			setChanges(changes.filter((_, i) => i !== index));
		};
		const addLesson = () => {
			setChanges(changes.concat([changes[changes.length - 1] || lessonsList[0]]));
		};

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
						<div className={styles.dayName} onClick={() => setChanging(true)}>
							{days[index]}
						</div>
						{changes.map((lesson, i) => (
							<Lesson
								changing={changing}
								key={days[index] + i}
								dayIndex={index}
								index={i}
								removeLesson={removeLesson}
								changeHandler={changeHandler}
								lesson={lesson}
								lessonsList={[...new Set([...lessonsList, ...changes])]}
							/>
						))}
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
	lessonsList: string[];
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

const Lesson: React.FC<LessonProps> = ({
	changing,
	dayIndex,
	lesson,
	index,
	changeHandler,
	lessonsList,
	removeLesson,
}) => {
	const lessonChangeHandler = (
		value: ValueType<optionType, false>,
		meta: ActionMeta<optionType>,
	) => {
		if (['create-option', 'select-option'].includes(meta.action) && isOptionType(value)) {
			changeHandler(index, value.value);
		}
	};

	const lessonOptions = lessonsList.map((les) => ({ value: les, label: les }));

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
};

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
