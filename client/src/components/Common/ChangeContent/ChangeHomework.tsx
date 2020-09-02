import React, { useEffect, useState } from 'react'
import "react-datepicker/dist/react-datepicker.css";
import DatePicker from "react-datepicker";
import { homework } from '../../../types';

import styles from './ChangeContent.module.css'
import createContentFiller, { ContentSectionProps } from "../../../utils/createContentChanger/createContentChanger";
import Suspender from "../Suspender/Suspender";
import { useQuery } from "@apollo/react-hooks";
import { GET_SCHEDULE, GET_LESSONS } from "../../Content/ClassPage/Sections/ScheduleSection/ScheduleSection";
import { ChangeContentProps } from "./ChangeContent";
import { useParams } from "react-router-dom";
import { memoize } from "../../../utils/functions";


const DEFAULT_LESSON = "Выберите предмет";

type changableHomework = Pick<homework, "lesson" | "to" | "attachments" | "text">
type ChangeHomeworkProps = {
    [K in keyof changableHomework]: ContentSectionProps<changableHomework[K]>
}

const ChangeHomework = createContentFiller<ChangeHomeworkProps>({
    lesson: {
        title: "Урок",
        ContentComponent: ({ value, changeHandler }) => {
            const { className } = useParams<{ className: string }>();
            const scheduleQuery = useQuery<{ schedule: string[][] }>(GET_SCHEDULE, { variables: { className } });
            const lessonsQuery = useQuery<{ lessons: string[] }>(GET_LESSONS);

            return (
                <Suspender queries={[scheduleQuery, lessonsQuery]}>
                    {({ schedule }: ({ schedule: string[][] }), { lessons }: { lessons: string[] }) => {
                        const possibleLessons = lessons.filter(lesson => schedule.some(day => day.includes(lesson)));

                        return <select
                            className={styles.selectLesson}
                            onChange={e => changeHandler(e.target.value)}
                            value={value}
                        >
                            {(!value || value === DEFAULT_LESSON) &&
                                <option key={`possibleLessonNothing`} disabled value={DEFAULT_LESSON}>
                                    {DEFAULT_LESSON}
                                </option>
                            }
                            <option value={value}>
                                {value}
                            </option>
                            {possibleLessons
                                .filter(lesson => lesson !== value)
                                .map((lesson) => (
                                    <option key={`${lesson}`} value={lesson}>
                                        {lesson}
                                    </option>)
                                )
                            }
                        </select>
                    }}
                </Suspender>
            )
        },
        defaultValue: "Выберите предмет",
        validator: (lesson) => { if (lesson === "" || lesson === DEFAULT_LESSON) return "Выберите урок" }
    },
    ...ChangeContentProps,
    to: {
        title: "Дата",
        ContentComponent: ({ changeHandler, value, state: { lesson } }) => {
            const { className } = useParams<{ className: string }>();
            const query = useQuery<{ schedule: string[][] }, { className: string }>(GET_SCHEDULE, { variables: { className } });
            const [schedule, setSchedule] = useState<string[][]>();

            useEffect(() => {
                if (query.data?.schedule) setSchedule(query.data.schedule);
            }, [query, query.data]);

            if (!lesson || query.loading) {
                return <DatePickerWrapper changeHandler={changeHandler} value={value} />
            } else {
                return <Suspender
                    fallback={<DatePickerWrapper changeHandler={changeHandler} value={value} />}
                    query={query}
                >
                    <>
                        {schedule &&
                            <DatePickerWrapper
                                changeHandler={changeHandler}
                                value={value}
                                renderDayContents={(day, date) => <OutlinedDay date={day} outlined={shouldBeOutlined(schedule, lesson, date.getDay())} />}
                            />
                        }
                    </>
                </Suspender>
            }
        },
        defaultValue: new Date().toISOString(),
        validator: (date) => { if (+date >= Date.now()) return "Дата на которую задано задание должно быть в будущем" }
    },
}, (state) => {
    if (state.text.trim() === "" && state.attachments.length === 0) {
        return "Задание должно содержать текст или фотографии";
    }
})

const findWeekDaysWithLesson = memoize((schedule: string[][], lesson: string): number[] => {
    return schedule.reduce((acc, c, i) => { if (c.includes(lesson)) { acc.push(i + 1) }; return acc }, [] as number[]);
})

const shouldBeOutlined = memoize((schedule: string[][], lesson: string, weekDay: number) => {
    return findWeekDaysWithLesson(schedule, lesson).includes(weekDay);
})

const OutlinedDay: React.FC<{ outlined: boolean, date?: number }> = ({ outlined, date }) => {
    return <span className={outlined ? styles.outlined : ""}>{date}</span>
}
const DatePickerWrapper: React.FC<{
    value: string,
    changeHandler: (date: string) => void,
    renderDayContents?: (day: number, date: Date) => JSX.Element
}> = ({ value, changeHandler, renderDayContents }) => (
    <DatePicker
        selected={new Date(value)}
        onChange={date => {
            if (date !== null) {
                changeHandler(date.toISOString());
            }
        }}
        minDate={new Date()}
        dateFormat={"dd/MM/yyyy"}
        className={styles.datePickerInput}
        showPopperArrow={false}
        calendarClassName={styles.datePickerCalendar}
        renderDayContents={renderDayContents}
    />
)

export default ChangeHomework;

