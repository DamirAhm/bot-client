import React from 'react'
import styles from './HomeworkSection.module.css'
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { homework, WithTypename } from '../../../../../types';
import Suspender from '../../../../Common/Suspender';
import { parseDate } from '../../../../../utils/date';
import Accordion from "../../../../Common/Accordion";
import { GoTriangleRight } from "react-icons/go";
import OpenableImg from '../../../../Common/OpenableImage';
import { FaPen } from 'react-icons/fa';
import { MdClose, MdCheck } from "react-icons/md";

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
            _id
        }
    }
`

const REMOVE_TASK = gql`
    mutation RemoveTask($className: String!, $homeworkId: String!) {
        removeHomework(homeworkId: $homeworkId, className: $className)
    }
`

const HomeworkSection: React.FC<Props> = ({ className }) => {
    const homeworkQuery = useQuery<{ homework: homework[] }>(GET_HOMEWORK, { variables: { className } });

    const [removeHomework] = useMutation<
        WithTypename<{
            removeHomework: string
        }>,
        {
            className: string,
            homeworkId: string,
        }
    >(REMOVE_TASK);

    const remove = (homeworkId: string) => {
        removeHomework({
            variables: { className, homeworkId: homeworkId },
            optimisticResponse: {
                __typename: "Mutation",
                removeHomework: homeworkId
            },
            update: (proxy, res) => {
                const data = proxy.readQuery<{ homework: homework[] }>({ query: GET_HOMEWORK, variables: { className } });

                if (res?.data) {
                    proxy.writeQuery({
                        query: GET_HOMEWORK,
                        variables: { className },
                        data: {
                            homework: data?.homework.filter(hw => hw._id !== homeworkId) || []
                        }
                    })
                }
            }
        })
    }

    return (
        <InfoSection name='Домашняя работа'>
            <Suspender query={homeworkQuery}>
                {(data: { homework: homework[] }) => {
                    const parsedHw = parseHomework(data.homework);
                    return <div className={styles.homework}>
                        {Object.keys(parsedHw).map(hwDate =>
                            <Accordion
                                key={hwDate}
                                Head={({ onClick, opened }) =>
                                    <p className={styles.date} onClick={onClick}>
                                        {hwDate}
                                        <GoTriangleRight size={15} className={opened ? styles.triangle_opened : ""} />
                                    </p>}
                                Body={() =>
                                    <>
                                        {Object.keys(parsedHw[hwDate]).map(lesson =>
                                            <Accordion
                                                className={styles.offseted} key={hwDate + lesson}
                                                Head={({ onClick, opened }) =>
                                                    <p className={`${styles.lesson}`} onClick={onClick}>
                                                        {lesson}
                                                        <GoTriangleRight
                                                            className={opened ? styles.triangle_opened : ""} size={10} />
                                                    </p>}
                                                Body={() =>
                                                    <div className={`${styles.tasks} ${styles.offseted}`}>
                                                        {parsedHw[hwDate][lesson].map((hw, i) => <Task key={hw._id} removeHomework={remove} homework={hw} />)}
                                                    </div>
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

type TaskProps = {
    homework: homework
    removeHomework: (homeworkId: string) => void
}



const Task: React.FC<TaskProps> = ({ homework, removeHomework }) => {
    return (
        <div className={styles.container}>
            <div key={homework.lesson + homework.task + Date.now()}
                className={`
                ${styles.task} 
                ${!homework.task && homework.attachments.length ? styles.fullImage : ""} 
                ${homework.task && !homework.attachments.length ? styles.fullText : ""}
                ${homework.attachments.length === 1 ? styles.onlyImage : ""}
            `}>
                {homework.attachments.length &&
                    <div className={styles.attachments}>
                        {homework.attachments.map((at, i) => <OpenableImg key={at + i} className={styles.attach} alt="Фото дз" src={at} />)}
                    </div>
                }
                {homework.task &&
                    <p className={styles.text}> {homework.task} </p>
                }
            </div>
            <div className={styles.controls}>
                <FaPen className={`${styles.pen}`} size={15} />
                <MdClose className={`${styles.remove}`} onClick={() => removeHomework(homework._id)} size={20} />
            </div>
        </div>
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