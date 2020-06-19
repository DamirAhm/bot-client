import React, { useState } from 'react'
import styles from './HomeworkSection.module.css'
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery, useMutation, useApolloClient } from '@apollo/react-hooks';
import { content, attachment, WithTypename, homework } from '../../../../../types';
import Suspender from '../../../../Common/Suspender';
import { parseDate } from '../../../../../utils/date';
import Accordion from "../../../../Common/Accordion";
import { GoTriangleRight } from "react-icons/go";
import OpenableImg, { ImgStab, OpenableImgProps } from '../../../../Common/OpenableImage';
import { FaPen } from 'react-icons/fa';
import { MdClose, MdCheck, MdAdd } from "react-icons/md";
import { useParams } from "react-router-dom";
import ReactDOM from "react-dom";
import ChangeContent from "../../../../Common/ChangeContent/ChangeContent";
import { GET_SCHEDULE, GET_LESSONS } from "../ScheduleSection/ScheduleSection";
import ConfirmReject from "../../../../Common/ConfirmReject";

const changeContentModalRoot = document.getElementById('changeContentModal');

type Props = {
    className: string
}
type taskProps = {
    homework: homework
    removeHomework: (homeworkId: string | undefined) => void,
    updateHomework: (homeworkId: string | undefined, updates: Partial<homework>) => void
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
            __typename
        }
    }
`

const REMOVE_TASK = gql`
    mutation RemoveTask($className: String!, $homeworkId: String!) {
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

const ADD_HOMEWORK = gql`
    mutation addHomework($className: String!, $text: String!, $to: String, $lesson: String!, $attachments: [ClassHomeworkAttachmentsInput]!) {
        addHomework(className: $className, text: $text, to: $to, lesson: $lesson, attachments: $attachments) {
            __typename
            text
            _id
            lesson
            to
            attachments {
                url
                value
            }
        }
    }
`

const HomeworkSection: React.FC<Props> = ({ className }) => {
    const [homeworkCreating, setHomeworkCreating] = useState(false);
    const homeworkQuery = useQuery<{ homework: homework[] }>(GET_HOMEWORK, { variables: { className } });

    const t = useApolloClient();

    (async () => {
        try {
            console.log(t.readQuery({
                query: GET_HOMEWORK, variables: { className }
            }, true))
        }
        catch (e) { }
    })()

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
            updates: Partial<Omit<homework, "attachments"> & { attachments: attachment[] }>
        }>(CHANGE_HOMEWORK);

    const [addHomework] = useMutation<
        WithTypename<{
            addHomework: WithTypename<homework>
        }>,
        {
            className: string,
            text: string,
            lesson: string,
            attachments: attachment[]
            to: string
        }
    >(ADD_HOMEWORK)

    const remove = (homeworkId: string | undefined) => {
        if (homeworkId) {
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
    }
    const update = (homeworkId: string | undefined, updates: Partial<homework>) => {
        if (homeworkId) {
            updateHomework({
                variables: { className, homeworkId, updates: { ...updates, attachments: updates.attachments?.map(({ __typename, ...att }) => att) } },
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
    }
    const add = (homeworkData: Omit<homework, "_id">) => {
        addHomework({
            variables: { ...homeworkData, className, attachments: homeworkData.attachments.map(({ __typename, ...att }) => att) },
            optimisticResponse: {
                __typename: "Mutation",
                addHomework: {
                    ...homeworkData,
                    _id: Date.now().toString(),
                    __typename: "ClassHomework"
                }
            },
            refetchQueries: [{
                query: GET_HOMEWORK,
                variables: { className }
            }]
        })
    }

    return (
        <>
            <InfoSection
                name='Домашняя работа'
                Header={({ opened, onClick }) =>
                    <div className={styles.sectionHeader} onClick={onClick}>
                        <div className={styles.title}>Домашняя работа <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={15} /></div>
                        <MdAdd size={30} onClick={(e) => (e.stopPropagation(), setHomeworkCreating(true))} />
                    </div>}>
                <Suspender query={homeworkQuery}>
                    {(data: { homework: WithTypename<homework>[] }) => {
                        const parsedHw = parseHomeworkByDate(data.homework);
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
            {changeContentModalRoot && homeworkCreating &&
                ReactDOM.createPortal(
                    <CreateHomeworkModal
                        returnHomework={add}
                        close={() => setHomeworkCreating(false)}
                    />,
                    changeContentModalRoot
                )}
        </>
    )
}

const Task: React.FC<taskProps> = ({ homework, removeHomework, updateHomework }) => {
    const [changing, setChanging] = useState(false);

    const parsedAttachments = addNextPrev(homework.attachments);

    return (
        <div className={`${styles.container} ${homework.attachments.length === 2 ? styles.pair : ""}`}>
            <div key={homework._id}
                className={styles.task}>
                {homework.attachments.length > 0 &&
                    <> {homework.attachments.length <= 2
                        ? <div className={styles.attachments}>
                            {homework.attachments.map(
                                (at, i) => <OpenableImg key={at.url + i} className={styles.attach} alt="Фото дз" {...parsedAttachments[i]} />
                            )}
                        </div>
                        : <ImgStab
                            {...parsedAttachments[0]}
                            Stab={({ onClick }) => (
                                <div className={styles.imgStab} onClick={onClick}>
                                    <span>{homework.attachments.length}</span>
                                    <span> Photos </span>
                                </div>
                            )} />
                    } </>
                }
                {homework.text &&
                    <p className={styles.text}> {homework.text} </p>
                }
                {changing && changeContentModalRoot &&
                    ReactDOM.createPortal(
                        <div className="modal" onMouseDown={() => setChanging(false)}>
                            <ChangeContent
                                contentChanger={(newContent: content) => updateHomework(homework._id, newContent)}
                                content={homework}
                                closer={() => setChanging(false)}
                                withConfirm={true}
                            />
                        </div>,
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
const CreateHomeworkModal: React.FC<{ returnHomework: (hw: Omit<homework, "_id">) => void, close: () => void }> = ({ returnHomework, close }) => {
    const { className } = useParams();

    const scheduleQuery = useQuery<{ schedule: string[][] }>(GET_SCHEDULE, { variables: { className } });
    const lessonsQuery = useQuery<{ lessons: string[] }>(GET_LESSONS);

    const [newHomework, setNewHomework] = useState<Omit<homework, "_id">>({
        attachments: [] as WithTypename<attachment>[],
        text: "",
        to: String(new Date()),
        lesson: ""
    });

    const checkUnEmptyContent = () => {
        return (newHomework.attachments.length > 0 || newHomework.text.trim() !== "") && newHomework.lesson !== "";
    }

    if (changeContentModalRoot) {
        return ReactDOM.createPortal(
            <div className={"modal"} onMouseDown={close}>
                <Suspender queries={[scheduleQuery, lessonsQuery]}>
                    {({ schedule }: ({ schedule: string[][] }), { lessons }: { lessons: string[] }) => {
                        const possibleLessons = lessons.filter(lesson => schedule.some(day => day.includes(lesson)));

                        return <div className={styles.homeworkCreator} onMouseDown={e => e.stopPropagation()}>
                            <div className={styles.addition}>
                                <ConfirmReject className={styles.confirmReject} confirm={() => checkUnEmptyContent() && (returnHomework(newHomework), close())} reject={close} />
                                <label className={styles.lessonPicker}>
                                    <h1 className={styles.title}>Урок </h1>
                                    <select
                                        className={styles.selectLesson}
                                        onChange={e => setNewHomework({ ...newHomework, lesson: e.target.value })}
                                    >
                                        <option key={`possibleLessonNothing`} value={""}>
                                            Выберите предмет
                                    </option>
                                        {possibleLessons
                                            .map((lesson, i) => <option key={`possibleLesson${i + lesson}`} value={lesson}>
                                                {lesson}
                                            </option>)
                                        }
                                    </select>
                                </label>
                            </div>
                            <ChangeContent
                                content={newHomework}
                                contentChanger={content => setNewHomework({ ...newHomework, ...content })}
                                withConfirm={false}
                                onChangeText={(newText) => setNewHomework({ ...newHomework, text: newText })}
                                onChangeTo={(newTo) => setNewHomework({ ...newHomework, to: newTo.toISOString() })}
                                onAddAttachment={(newAttachment) => setNewHomework({ ...newHomework, attachments: [...newHomework.attachments, newAttachment] })}
                                onRemoveAttachment={(attachmentId) => setNewHomework(
                                    {
                                        ...newHomework,
                                        attachments: newHomework.attachments.filter(({ _id }) => _id !== attachmentId)
                                    })}
                            />
                        </div>
                    }
                    }
                </Suspender>
            </div>
            , changeContentModalRoot)
    }
    return null;
}

const parseHomeworkByDate = (homework: WithTypename<homework>[]): { [day: string]: { [lesson: string]: homework[] } } => {
    const parsedHw = {} as { [day: string]: { [lesson: string]: homework[] } } & object;

    const sortedHomework = homework.sort((a, b) => Date.parse(a.to) - Date.parse(b.to));

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
const addNextPrev: (atts: attachment[]) => OpenableImgProps[] = (attachments) => {
    const parsedAttachments: OpenableImgProps[] = [];

    for (let i = 0; i < attachments.length; i++) {
        const newImgProps: OpenableImgProps = {} as OpenableImgProps;
        newImgProps.src = attachments[i].url;
        parsedAttachments.push(newImgProps);
    }
    for (let i = 0; i < parsedAttachments.length; i++) {
        if (i + 1 < parsedAttachments.length) {
            parsedAttachments[i].nextImg = parsedAttachments[i + 1];
        }
        if (i - 1 >= 0) {
            parsedAttachments[i].prevImg = parsedAttachments[i - 1];
        }
    }

    return parsedAttachments;
}

export default HomeworkSection