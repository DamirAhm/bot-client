import React, { useState, memo, ChangeEvent, useEffect, useCallback } from 'react'
import { gql } from 'apollo-boost';
import InfoSection from '../../InfoSection/InfoSection';
import { useQuery, useMutation } from '@apollo/react-hooks';
import Suspender from '../../../../Common/Suspender/Suspender';
import styles from "./ScheduleSection.module.css";
import { MdClose } from "react-icons/md";
import { redactorOptions, WithTypename } from '../../../../../types';
import Options from "../../../../Common/Options/Options";
import {
    DragDropContext,
    DropResult,
} from "react-beautiful-dnd";
import { DraggableEntity, DroppableEntity } from "../../../../Common/DragAndDropEntities";

const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
type Props = {
    className: string,
}

export const GET_SCHEDULE = gql`
    query GetSchedule($className: String!){
        schedule: getSchedule(className: $className)
    }
`
export const GET_LESSONS = gql`
    query GetLessons {
        lessons: getLessons
    }
`

const CHANGE_SCHEDULE = gql`
    mutation ChangeDay($className: String!, $dayIndex: Int!, $newDay: [String]!) {
        changed: changeDay(className: $className, dayIndex: $dayIndex, newSchedule: $newDay) {
            __typename
            name
            schedule
        }
    }
`

type scheduleData = { schedule: string[][], lessonsList: string[] };

const ScheduleSection: React.FC<Props> = ({ className }) => {
    const [isAnyLessonDragging, setIsAnyLessonDragging] = useState(false);
    const [scheduleData, setScheduleData] = useState<Partial<scheduleData> | null>(null)

    const scheduleQuery = useQuery<{ schedule: string[][] }>(GET_SCHEDULE, { variables: { className } });
    const lessonsQuery = useQuery<{ lessons: string[] }>(GET_LESSONS);

    const [changeDay] = useMutation<
        WithTypename<{ changed: WithTypename<{ name: string, schedule: string[][] }> }>,
        { className: string, dayIndex: number, newDay: string[] }>(CHANGE_SCHEDULE)

    const changeSchedule = useCallback((changes: string[], dayIndex: number) => {
        changeDay({
            variables: { className, dayIndex, newDay: changes },
            optimisticResponse: {
                __typename: "Mutation",
                changed: {
                    __typename: "Class",
                    name: className,
                    schedule: scheduleQuery.data?.schedule.map((day, i) => i === dayIndex ? changes : day) || [[], [], [], [], [], []]
                }
            },
            update: (proxy, data) => {
                const query = proxy.readQuery<{ schedule: string[][] }>({ query: GET_SCHEDULE, variables: { className } })

                if (query?.schedule) {
                    proxy.writeQuery({
                        query: GET_SCHEDULE,
                        variables: { className },
                        data: {
                            schedule: scheduleQuery.data?.schedule.map((day, i) => i === dayIndex ? changes : day)
                        }
                    })
                }
            }
        })
    }, [changeDay, className, scheduleQuery])

    const onDragStart = () => {
        setIsAnyLessonDragging(true);
    }
    const onDragEnd = (initial: DropResult) => {
        const schedule = scheduleData?.schedule;
        if (schedule) {
            const { destination, source } = initial;

            if (destination && source) {
                const newSchedule = [...schedule];

                const lesson = newSchedule[+source.droppableId].splice(source.index, 1)[0];

                //appends lesson after element at source index
                newSchedule[+destination.droppableId].splice(destination.index, 0, lesson);

                setScheduleData({ lessonsList: scheduleData?.lessonsList, schedule: newSchedule });
            }
        }

        setIsAnyLessonDragging(false);
    }

    useEffect(() => {
        const newScheduleData: Partial<scheduleData> = {};
        if (scheduleQuery.data) {
            newScheduleData.schedule = scheduleQuery.data.schedule;
        }
        if (lessonsQuery.data) {
            newScheduleData.lessonsList = lessonsQuery.data.lessons;
        }

        setScheduleData(newScheduleData);
    }, [scheduleQuery, lessonsQuery, scheduleQuery.data, lessonsQuery.data])

    return (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <InfoSection name={"Расписание"}>
                <Suspender queries={[scheduleQuery, lessonsQuery]}>
                    {scheduleData && scheduleData.schedule !== undefined && scheduleData.lessonsList !== undefined &&
                        <div className={styles.days}>
                            {scheduleData.schedule.map((day, i) => (
                                <ScheduleDay
                                    changeDay={changeSchedule}
                                    lessonsList={scheduleData.lessonsList as string[]}
                                    key={"day" + i}
                                    index={i}
                                    isAnyLessonDragging={isAnyLessonDragging}
                                    lessons={day} />
                            ))}
                        </div>
                    }
                </Suspender>
            </InfoSection>
        </DragDropContext>
    )
}

type ScheduleDayProps = {
    index: number,
    lessons: string[],
    lessonsList: string[],
    changeDay: (changes: string[], dayIndex: number) => void,
    isAnyLessonDragging: boolean,
}

const ScheduleDay: React.FC<ScheduleDayProps> = memo(({ index, lessons, lessonsList, changeDay, isAnyLessonDragging }) => {
    const [changing, setChanging] = useState(false);
    const [changes, setChanges] = useState(lessons);

    const iconSize = 15;

    const reject = () => {
        setChanging(false);
        setChanges(lessons);
    }
    const confirm = () => {
        setChanging(false);
        //TODO add error handling
        changeDay(changes, index);
    }

    const changeHandler = (e: ChangeEvent<{ value: string } & Element>) => {
        const index = e.target?.getAttribute("data-index");
        if (index !== undefined && index !== null) {
            const t = [...changes];
            t[+index] = e.target.value;
            setChanges(t);
        }
    }

    const removeLesson = (index: number) => {
        setChanges(changes.filter((_, i) => i !== index));
    }
    const addLesson = () => {
        setChanges(changes.concat([(changes[changes.length - 1] || lessonsList[0])]));
    }

    return <DroppableEntity className={styles.droppableDay} droppableId={String(index)} isDropDisabled={!changing}>
        <div className={styles.day} onDoubleClick={() => setChanging(true)}>
            <div className={`${styles.lessons} ${changing && isAnyLessonDragging ? styles.lessonDraging : ""}`}>
                <div className={styles.dayName} onClick={() => setChanging(true)}> {days[index]} </div>
                {changes.map((lesson, i) => (
                    <Lesson
                        changing={changing}
                        key={days[index] + i}
                        dayIndex={index}
                        index={i}
                        removeLesson={removeLesson}
                        changeHandler={changeHandler}
                        lesson={lesson}
                        lessonsList={lessonsList}
                    />
                ))}
                {/*//? In different element because confirm and reject should be on the bottom of component */}
                {changing && !isAnyLessonDragging &&
                    <div className={styles.addLesson + " " + styles.lesson} onClick={addLesson}> Добавить урок </div>
                }
            </div>
            {!changing
                ? <Options
                    include={redactorOptions.change}
                    props={{
                        className: styles.pen,
                        size: iconSize,
                        onClick: () => setChanging(true),
                        allowOnlyRedactor: true,
                    }}
                />
                : <div className={styles.changers}>
                    {!isAnyLessonDragging &&
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
                                    allowOnlyRedactor: true
                                }
                            }}
                            size={iconSize + 5}
                        />
                    }
                </div>
            }
        </div>
    </DroppableEntity>
})

type LessonProps = {
    changing: boolean,
    dayIndex: number,
    lesson: string,
    index: number,
    changeHandler: React.SelectHTMLAttributes<HTMLSelectElement>["onChange"],
    lessonsList: string[],
    removeLesson: (index: number) => void,
}

const Lesson: React.FC<LessonProps> = ({ changing, dayIndex, lesson, index, changeHandler, lessonsList, removeLesson }) => {
    return (
        <DraggableEntity
            draggableId={String(dayIndex) + String(index)}
            className={`${styles.lesson} ${changing ? styles.changingLesson : ""}`}
            index={index}
            isDragDisabled={!changing}
        >
            {
                !changing
                    ? <span key={dayIndex + lesson + index}> {index + 1})  {lesson} </span>
                    : <div className={styles.lessonChange} key={`picker${dayIndex + lesson + index}`}>
                        <select
                            data-index={index} className={styles.selectLesson} name="lesson"
                            id={styles.pickLesson} onChange={changeHandler}>
                            <option key={"pick-1"} value="lesson">
                                {lesson}
                            </option>
                            {lessonsList
                                .filter(les => les !== lesson)
                                .map(lesson => <option key={`pick${styles.pickLesson + dayIndex + lesson}`} value={lesson}>
                                    {lesson}
                                </option>)}
                        </select>
                        <MdClose className={"remove " + styles.removeLesson} size={20} onClick={() => removeLesson(index)} />
                    </div>
            }
        </DraggableEntity>
    )
}

export default ScheduleSection;