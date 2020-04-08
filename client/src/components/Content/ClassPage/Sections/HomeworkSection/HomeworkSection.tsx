import React from 'react'
import styles from './HomeworkSection.module.css'
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';
import { homework } from '../../../../../types';
import Suspender from '../../../../Common/Suspender';
import { parseDate } from '../../../../../utils/date';
import Accordion from "../../../../Common/Accordion";
import { GoTriangleRight } from "react-icons/go";

type Props = {
    className: string
}

const GET_HOMEWORK = gql`
    query GetHomework($className: String!) {
        homework: getHomework(className: $className) {
            task
            createdBy
            to
            attachments
            lesson
        }
    }
`

const HomeworkSection: React.FC<Props> = ({ className }) => {
    const homeworkQuery = useQuery<{ homework: homework[] }>(GET_HOMEWORK, { variables: { className } });
    console.log(styles)
    return (
        <InfoSection name='Домашняя работа'>
            <Suspender query={homeworkQuery}>
                {(data: { homework: homework[] }) => {
                    const parsedHw = parseHomework(data.homework);
                    return <div className={styles.homework}>
                        {Object.keys(parsedHw).map(hwDate =>
                            <Accordion
                                key={hwDate}
                                Head={({ onClick, opened }) => <p className={styles.date} onClick={onClick}> {hwDate} <GoTriangleRight size={15} className={opened ? styles.triangle_opened : ""} /> </p>}
                                Body={() =>
                                    <>
                                        {Object.keys(parsedHw[hwDate]).map(lesson =>
                                            <Accordion
                                                className={styles.offseted} key={hwDate + lesson}
                                                Head={({ onClick, opened }) => <p className={`${styles.lesson}`} onClick={onClick}> {lesson} <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={10} /> </p>}
                                                Body={() =>
                                                    <>
                                                        {parsedHw[hwDate][lesson].map(({ task }) => <div key={hwDate + lesson + task} className={`${styles.offseted} ${styles.task}`}> {task.trim()} </div>)}
                                                    </>
                                                }
                                            />
                                        )}
                                    </>
                                }
                            />
                        )}
                    </div>
                }
                }
            </Suspender>
        </InfoSection>
    )
}

const parseHomework = (homework: homework[]): { [day: string]: { [lesson: string]: homework[] } } => {
    const parsedHw = {} as { [day: string]: { [lesson: string]: homework[] } } & object;

    for (let hw of homework) {
        const hwDate = parseDate(hw.to, "dd MM");
        if (parsedHw.hasOwnProperty(hwDate)) {
            if (parsedHw[hwDate][hw.lesson]) {
                parsedHw[hwDate][hw.lesson].push(hw);
            } else {
                parsedHw[hwDate][hw.lesson] = [hw];
            }
        } else {
            parsedHw[hwDate] = { [hw.lesson]: [hw] };
        }
    }

    return parsedHw;
}

export default HomeworkSection