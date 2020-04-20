import React, { useState, memo, ChangeEvent, useRef } from 'react'
import { gql } from 'apollo-boost';
import InfoSection from '../../InfoSection/InfoSection';
import { useQuery, useMutation } from '@apollo/react-hooks';
import Suspender from '../../../../Common/Suspender';
import styles from "./ScheduleSection.module.css";
import { FaPen } from "react-icons/fa";
import { MdClose, MdCheck } from "react-icons/md";
import { changeHandler } from '../../../StudentPage/StudentInfo/Changer';
import { useParams } from "react-router-dom";
import { WithTypename } from '../../../../../types';

const days = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]
type Props = {
    className: string,
}

const GET_SCHEDULE = gql`
    query GetSchedule($className: String!){
        schedule: getSchedule(className: $className)
    }
`
const GET_LESSONS = gql`
    {
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

const ScheduleSection: React.FC<Props> = ({ className }) => {
    const scheduleQuery = useQuery<{ schedule: string[][] }>(GET_SCHEDULE, { variables: { className } });
    const lessonsQuery = useQuery<{ lessons: string[] }>(GET_LESSONS);

    const [changeDay] = useMutation<
        WithTypename<{ changed: WithTypename<{ name: string, schedule: string[][] }> }>,
        { className: string, dayIndex: number, newDay: string[] }>(CHANGE_SCHEDULE)

    const changeSchedule = (changes: string[], dayIndex: number) => {
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
    }

    return (
        <InfoSection name={"Расписание"}>
            <Suspender queries={[scheduleQuery, lessonsQuery]}>
                {(scheduleData: ({ schedule: string[][] }), lessonsList: { lessons: string[] }) => {
                    return <div className={styles.days}>
                        {scheduleData.schedule.map((day, i) => <ScheduleDay changeDay={changeSchedule} lessonsList={lessonsList.lessons} key={"day" + i} index={i} lessons={day} />)}
                    </div>
                }
                }
            </Suspender>
        </InfoSection>
    )
}

type ScheduleDayProps = {
    index: number,
    lessons: string[],
    lessonsList: string[],
    changeDay: (changes: string[], dayIndex: number) => void
}

const ScheduleDay: React.FC<ScheduleDayProps> = memo(({ index, lessons, lessonsList, changeDay }) => {
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
        if (index != undefined) {
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

    return <div className={styles.day}>
        {!changing && <FaPen className={styles.pen} size={iconSize} onClick={() => setChanging(true)} />}
        <div className={styles.value}>
            <div className={styles.dayName}> {days[index]} </div>
            {changes.map((lesson, i) => !changing ?
                <pre key={index + lesson + i} className={styles.lesson}> {i + 1})  {lesson} </pre> :
                <div className={styles.lessonChange} key={`picker${index + lesson + i}`}>
                    <select
                        data-index={i} className={styles.selectLesson} name="lesson"
                        id={styles.pickLesson + index + lesson} onChange={changeHandler}>

                        <option key={"pick-1"} value="lesson">
                            {lesson}
                        </option>

                        {lessonsList
                            .filter(les => les !== lesson)
                            .map(lesson => <option key={`pick${styles.pickLesson + index + lesson}`} value={lesson}>
                                {lesson}
                            </option>)}

                    </select>
                    <MdClose className={"remove " + styles.removeLesson} size={20} onClick={() => removeLesson(i)} />
                </div>)
            }
            {changing &&
                <div className={styles.addLesson + " " + styles.lesson} onClick={addLesson}> Добавить урок </div>
            }
        </div>
        {changing &&
            <div className={styles.changers}>
                <MdClose onClick={reject} size={iconSize + 5} className={`remove ${styles.changer}`} />
                <MdCheck onClick={confirm} size={iconSize + 5} className={`confirm ${styles.changer}`} />
            </div>
        }
    </div>
})

export default ScheduleSection;