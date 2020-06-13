import React, { useState } from 'react'
import styles from './HomeworkSection.module.css'
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { homework, WithTypename, content } from '../../../../../types';
import Suspender from '../../../../Common/Suspender';
import { parseDate } from '../../../../../utils/date';
import Accordion from "../../../../Common/Accordion";
import { GoTriangleRight } from "react-icons/go";
import OpenableImg from '../../../../Common/OpenableImage';
import { FaPen } from 'react-icons/fa';
import { MdClose, MdCheck } from "react-icons/md";
import { useParams } from "react-router-dom";
import ReactDOM from "react-dom";
import ChangeContent from "../../../../Common/ChangeContent/ChangeContent";

const changeContentModalRoot = document.getElementById('changeContentModal');

type Props = {
    className: string
}

const GET_HOMEWORK = gql`
    query GetHomework($className: String!) {
        homework: getHomework(className: $className) {
            text
            createdBy
            to
            attachments {
                url
                value
                _id
            }
            lesson
            _id
        }
    }
`

const REMOVE_TASK = gql`
    mutation Removetext($className: String!, $homeworkId: String!) {
        removeHomework(homeworkId: $homeworkId, className: $className)
    }
`

const CHANGE_HOMEWORK = gql`
    mutation ChangeHomework($className: String!, $homeworkId: String!, $updates: ClassHomeworkInput!) {
        updateHomework(className: $className, homeworkId: $homeworkId, updates: $updates) {
            _id 
            text
            attachments { 
                url 
                value
                _id
            }
            to
            lesson
        }
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

    const [updateHomework] = useMutation<
        WithTypename<{
            updateHomework: WithTypename<Partial<homework>>
        }>,
        {
            className: string,
            homeworkId: string,
            updates: Partial<homework>
        }>(CHANGE_HOMEWORK);

    const remove = (homeworkId: string) => {
        removeHomework({
            variables: { className, homeworkId },
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
    const update = (homeworkId: string, updates: Partial<homework>) => {
        if (updates.attachments && updates.attachments.length > 0) {
            for (const at of updates.attachments) {
                delete at.__typename;
            }
        }
        updateHomework({
            variables: { className, homeworkId, updates },
            optimisticResponse: {
                __typename: "Mutation",
                updateHomework: {
                    __typename: "ClassHomework",
                    _id: homeworkId,
                    ...homeworkQuery?.data?.homework.find(hw => hw._id === homeworkId),
                    ...updates
                }
            },
            update: (proxy, res) => {
                const data = proxy.readQuery<{ homework: homework[] }>({ query: GET_HOMEWORK, variables: { className } });

                if (res?.data) {
                    proxy.writeQuery({
                        query: GET_HOMEWORK,
                        variables: { className },
                        data: {
                            homework: data?.homework.map(hw => hw._id === homeworkId ? res.data?.updateHomework : hw) || []
                        }
                    })
                }
            }
        })
    }

    return (
        <InfoSection name='Домашняя работа'>
            <Suspender query={homeworkQuery}>
                {(data: { homework: WithTypename<homework>[] }) => {
                    const parsedHw = parseHomework(data.homework);
                    return <div className={styles.homework}>
                        {Object.keys(parsedHw).map(hwDate =>
                            <Accordion
                                key={hwDate}
                                Head={({ onClick, opened }) =>
                                    <p className={`${styles.date} ${styles.accordion}`} onClick={onClick}>
                                        {hwDate}
                                        <GoTriangleRight size={15} className={opened ? styles.triangle_opened : ""} />
                                    </p>}
                                Body={() =>
                                    <>
                                        {Object.keys(parsedHw[hwDate]).map(lesson =>
                                            <Accordion
                                                className={styles.offseted} key={hwDate + lesson}
                                                Head={({ onClick, opened }) =>
                                                    <p className={`${styles.lesson} ${styles.accordion}`} onClick={onClick}>
                                                        {lesson}
                                                        <GoTriangleRight
                                                            className={opened ? styles.triangle_opened : ""} size={10} />
                                                    </p>}
                                                Body={() =>
                                                    <div className={`${styles.tasks} ${styles.offseted}`}>
                                                        {parsedHw[hwDate][lesson].map((hw, i) => <Task updateHomework={update} key={hw._id} removeHomework={remove} homework={hw} />)}
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

type taskProps = {
    homework: homework
    removeHomework: (homeworkId: string) => void,
    updateHomework: (homeworkId: string, updates: Partial<homework>) => void
}



const Task: React.FC<taskProps> = ({ homework, removeHomework, updateHomework }) => {
    const { className } = useParams<{ className: string }>();

    const [changes, setChanges] = useState({} as Partial<typeof homework>);
    const [changing, setChanging] = useState(false);

    return (
        <div className={styles.container}>
            <div key={homework.lesson + homework.text + Date.now()}
                className={`
                ${styles.task} 
                ${!homework.text && homework.attachments.length ? styles.fullImage : ""} 
                ${homework.text && !homework.attachments.length ? styles.fullText : ""}
                ${homework.attachments.length === 1 ? styles.onlyImage : ""}
            `}>
                {homework.attachments.length > 0 &&
                    <div className={styles.attachments}>
                        {homework.attachments.map((at, i) => <OpenableImg key={at.url + i} className={styles.attach} alt="Фото дз" src={at.url} />)}
                    </div>
                }
                {homework.text &&
                    <p className={styles.text}> {homework.text} </p>
                }
                {changing && changeContentModalRoot &&
                    ReactDOM.createPortal(
                        <ChangeContent
                            contentChanger={(newContent: content) => updateHomework(homework._id, newContent)}
                            content={homework} closer={() => setChanging(false)} />,
                        changeContentModalRoot)
                }
            </div>
            <div className={styles.controls}>
                <FaPen onClick={() => setChanging(true)} className={`${styles.pen}`} size={15} />
                <MdClose className={`${styles.remove}`} onClick={() => removeHomework(homework._id)} size={20} />
            </div>
        </div>
    )
}

const parseHomework = (homework: WithTypename<homework>[]): { [day: string]: { [lesson: string]: homework[] } } => {
    const parsedHw = {} as { [day: string]: { [lesson: string]: homework[] } } & object;

    for (let hw of homework) {
        delete hw.__typename;
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