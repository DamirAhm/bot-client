import React from 'react'
import "react-datepicker/dist/react-datepicker.css";
import { homework } from '../../../types';

import styles from './ChangeContent.module.css'
import createContentFiller, { ContentSectionProps } from "../../../utils/createContentChanger/createContentChanger";
import Suspender from "../Suspender/Suspender";
import { useQuery } from "@apollo/react-hooks";
import { GET_SCHEDULE, GET_LESSONS } from "../../Content/ClassPage/Sections/ScheduleSection/ScheduleSection";
import { ChangeContentProps } from "./ChangeContent";
import { useParams } from "react-router-dom";


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
                                <option key={`possibleLessonNothing`} value={DEFAULT_LESSON}>
                                    {DEFAULT_LESSON}
                                </option>
                            }
                            {possibleLessons
                                .map((lesson, i) => <option key={`possibleLesson${lesson}`} value={lesson}>
                                    {lesson}
                                </option>)
                            }
                        </select>
                    }}
                </Suspender>
            )
        },
        defaultValue: "Выберите предмет",
        validator: (lesson) => { if (lesson === "" || lesson === DEFAULT_LESSON) return "Выберите урок" }
    },
    ...ChangeContentProps
}, (state) => {
    if (state.text.trim() === "" && state.attachments.length === 0) {
        return "Задание должно содержать текст или фотографии";
    }
})

export default ChangeHomework;

