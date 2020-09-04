import React, { useContext, useState } from 'react'
import styles from '../Common/ContentSection.module.css'
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { attachment, WithTypename, announcement, redactorOptions } from '../../../../../types';
import Suspender from '../../../../Common/Suspender/Suspender';
import Accordion from "../../../../Common/Accordion/Accordion";
import { GoTriangleRight } from "react-icons/go";
import ReactDOM from "react-dom";
import ChangeContent from "../../../../Common/ChangeContent/ChangeContent";
import ImgAlbum from "../../../../Common/OpenableImage/ImgAlbum";
import { parseContentByDate, getDateStrFromDayMonthStr, objectForEach } from "../../../../../utils/functions";
import Options from "../../../../Common/Options/Options";
import { UserContext } from "../../../../../App";

const announcementContentModalRoot = document.getElementById('changeContentModal');

type Props = {
    className: string
}
type announcementProps = {
    announcement: announcement
    removeAnnouncement: (announcementId: string | undefined) => void,
    updateAnnouncement: (announcementId: string | undefined, updates: Partial<announcement>) => void
}

const GET_ANNOUNCEMENTS = gql`
    query GetAnnouncements($className: String!) {
        announcements: getAnnouncements(className: $className) {
            text
            createdBy
            to
            attachments {
                url
                value
                _id
            }
            _id
            __typename
        }
    }
`

const REMOVE_ANNOUNCEMENT = gql`
    mutation RemoveAnnouncement($className: String!, $announcementId: String!) {
        removeAnnouncement(announcementId: $announcementId, className: $className)
    }
`

const UPDATE_ANNOUNCEMENT = gql`
    mutation UpdateAnnouncement($className: String!, $announcementId: String!, $updates: ClassAnnouncementsInput!) {
        updateAnnouncement(className: $className, announcementId: $announcementId, updates: $updates) {
            _id 
            text
            attachments { 
                url 
                value
                _id
            }
            to
        }
    }
`

const ADD_ANNOUNCEMENT = gql`
    mutation addAnnouncement($className: String!, $text: String!, $to: String, $attachments: [ClassHomeworkAttachmentsInput]!, $student_id: Int!) {
        addAnnouncement(className: $className, text: $text, to: $to, attachments: $attachments, student_id: $student_id) {
            __typename
            text
            _id
            to
            attachments {
                url
                value
            }
        }
    }
`

const REMOVE_OLD_ANNOUNCEMENTS = gql`
    mutation RemoveOldAnnouncements($className: String!) {
        removeOldAnnouncements(className: $className) {
            to
            text
            attachments {
                url
                value
                _id
            }
            createdBy
            _id
        }
    }
`

const AnnouncementsSection: React.FC<Props> = ({ className }) => {
    const [announcementCreating, setAnnouncementCreating] = useState(false);
    const [initContent, setInitContent] = useState({});
    const announcementsQuery = useQuery<{ announcements: announcement[] }>(GET_ANNOUNCEMENTS, { variables: { className } });
    const { uid } = useContext(UserContext);

    const [removeAnnouncement] = useMutation<
        WithTypename<{
            removeAnnouncement: string
        }>,
        {
            className: string,
            announcementId: string,
        }
    >(REMOVE_ANNOUNCEMENT);
    const [updateAnnouncement] = useMutation<
        WithTypename<{
            updateAnnouncement: WithTypename<Partial<announcement>>
        }>,
        {
            className: string,
            announcementId: string,
            updates: Partial<Omit<announcement, "attachments"> & { attachments: attachment[] }>
        }>(UPDATE_ANNOUNCEMENT);
    const [addAnnouncement] = useMutation<
        WithTypename<{
            addAnnouncement: WithTypename<announcement>
        }>,
        {
            className: string,
            text: string,
            attachments: attachment[]
            to: string,
            student_id: number
        }
    >(ADD_ANNOUNCEMENT)
    const [removeOldAnnouncements] = useMutation<
        { removeOldAnnouncements: announcement[] },
        { className: string }
    >(REMOVE_OLD_ANNOUNCEMENTS, {
        variables: { className },
        optimisticResponse: {
            removeOldAnnouncements: announcementsQuery.data?.announcements?.filter(({ to }) => Date.now() - Date.parse(to) <= 24 * 60 * 60 * 1000) || []
        },
        update: (proxy, mutation) => {
            if (mutation && mutation.data?.removeOldAnnouncements) {
                proxy.writeQuery({
                    query: GET_ANNOUNCEMENTS,
                    variables: { className },
                    data: {
                        announcements: mutation.data.removeOldAnnouncements
                    }
                })
            }
        }
    });


    const remove = (announcementId: string | undefined) => {
        if (announcementId) {
            removeAnnouncement({
                variables: { className, announcementId },
                optimisticResponse: {
                    __typename: "Mutation",
                    removeAnnouncement: announcementId
                },
                update: (proxy, res) => {
                    const data = proxy.readQuery<{ announcements: announcement[] }>({ query: GET_ANNOUNCEMENTS, variables: { className } });

                    if (res?.data) {
                        proxy.writeQuery({
                            query: GET_ANNOUNCEMENTS,
                            variables: { className },
                            data: {
                                announcements: data?.announcements.filter(chng => chng._id !== announcementId) || []
                            }
                        })
                    }
                }
            })
        }
    }
    const update = (announcementId: string | undefined, updates: Partial<WithTypename<announcement>>) => {
        const { __typename, ...announcementWithoutTypename } = updates;

        if (announcementId) {
            updateAnnouncement({
                variables: {
                    className,
                    announcementId,
                    updates: {
                        ...announcementWithoutTypename,
                        attachments: updates.attachments?.map(({ __typename, ...att }) => att)
                    }
                },
                optimisticResponse: {
                    __typename: "Mutation",
                    updateAnnouncement: {
                        __typename: "ClassAnnouncement",
                        _id: announcementId,
                        ...announcementsQuery?.data?.announcements.find(hw => hw._id === announcementId),
                        ...updates
                    }
                },
                update: (proxy, res) => {
                    const data = proxy.readQuery<{ announcements: announcement[] }>({ query: GET_ANNOUNCEMENTS, variables: { className } });

                    if (res?.data) {
                        proxy.writeQuery({
                            query: GET_ANNOUNCEMENTS,
                            variables: { className },
                            data: {
                                homework: data?.announcements.map(chng => chng._id === announcementId ? res.data?.updateAnnouncement : chng) || []
                            }
                        })
                    }
                }
            })
        }
    }
    const add = (announcementData: Omit<announcement, "_id">) => {
        addAnnouncement({
            variables: {
                ...announcementData,
                className,
                attachments: announcementData?.attachments?.map(({ __typename, ...att }) => att),
                student_id: uid
            },
            optimisticResponse: {
                __typename: "Mutation",
                addAnnouncement: {
                    ...announcementData,
                    _id: Date.now().toString(),
                    __typename: "ClassAnnouncement"
                }
            },
            refetchQueries: [{
                query: GET_ANNOUNCEMENTS,
                variables: { className }
            }]
        })
    }

    return (
        <>
            <InfoSection
                name='Обьявления'
                Header={({ opened, onClick }) =>
                    <div className={`${styles.sectionHeader} ${styles.contentHeader}`} onClick={onClick}>
                        <div className={styles.title}>
                            Обьявления
                            <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={15} />
                        </div>

                        <Add onClick={(e) => { e.stopPropagation(); setAnnouncementCreating(true) }} />
                    </div>}>
                <Suspender query={announcementsQuery}>
                    {({ announcements }: { announcements?: WithTypename<announcement>[] }) => {
                        if (announcements) {
                            const [oldAnnouncements, actualAnnouncements] = parseContentByDate(announcements);

                            return <div className={styles.content}>
                                {Object.keys(oldAnnouncements).length > 0 &&
                                    <Accordion
                                        initiallyOpened={false}
                                        Head={({ opened }) =>
                                            <div className={styles.oldContentHeader}>
                                                <p className={`${styles.date} ${styles.accordion}`}>
                                                    Старые обьявления
                                                    <GoTriangleRight size={15} className={opened ? styles.triangle_opened : ""} />
                                                </p>

                                                <Options
                                                    include={redactorOptions.delete}
                                                    props={{
                                                        allowOnlyRedactor: true,
                                                        className: `remove ${styles.removeOldContent}`,
                                                        size: 20,
                                                        onClick: () => removeOldAnnouncements()
                                                    }}
                                                />
                                            </div>
                                        }
                                    >
                                        <div className={styles.offseted}>
                                            <AnnouncementLayout
                                                announcements={oldAnnouncements}
                                                initiallyOpened={false}
                                                setAnnouncementCreating={setAnnouncementCreating}
                                                setInitContent={setInitContent}
                                                update={update}
                                                remove={remove}
                                            />
                                        </div>
                                    </Accordion>
                                }
                                <AnnouncementLayout
                                    announcements={actualAnnouncements}
                                    setAnnouncementCreating={setAnnouncementCreating}
                                    setInitContent={setInitContent}
                                    update={update}
                                    remove={remove}
                                />
                            </div>
                        } else {
                            return null;
                        }
                    }
                    }
                </Suspender>
            </InfoSection>
            {announcementContentModalRoot && announcementCreating &&
                ReactDOM.createPortal(
                    <CreateAnnouncementModal
                        returnAnnouncement={add}
                        close={() => setAnnouncementCreating(false)}
                        initContent={initContent}
                    />,
                    announcementContentModalRoot
                )}
        </>
    )
}

const AnnouncementLayout: React.FC<{
    announcements: {
        [day: string]: announcement[]
    }
    initiallyOpened?: boolean
    setAnnouncementCreating: (state: boolean) => void
    setInitContent: (initContent: Partial<announcement>) => void
    update: (homeworkId: string | undefined, updates: Partial<announcement>) => void
    remove: (homeworkId: string | undefined) => void
}> = React.memo(({
    announcements, remove, update,
    setAnnouncementCreating, setInitContent,
    initiallyOpened = true
}) => {
    return <>
        {Object.keys(announcements).map(announcementDate =>
            <Accordion
                initiallyOpened={initiallyOpened}
                key={announcementDate}
                Head={({ opened }) =>
                    <div className={styles.sectionHeader}>
                        <div className={styles.title}>
                            {announcementDate}
                            <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={15} />
                        </div>
                        <Add onClick={(e) => {
                            e.stopPropagation();
                            setAnnouncementCreating(true);
                            setInitContent({ to: getDateStrFromDayMonthStr(announcementDate) })
                        }} />
                    </div>
                }
            >
                <>
                    <div className={`${styles.elements} ${styles.offseted}`}>
                        {announcements[announcementDate].map((announcement, i) =>
                            <Announcement
                                updateAnnouncement={update}
                                key={announcement._id}
                                removeAnnouncement={remove}
                                announcement={announcement} />
                        )}
                    </div>
                </>
            </Accordion>
        )}
    </>
})

const Announcement: React.FC<announcementProps> = ({ announcement, removeAnnouncement, updateAnnouncement }) => {
    const [updating, setUpdating] = useState(false);

    return (
        <div className={`${styles.container} ${announcement.attachments.length === 2 ? styles.pair : ""}`} onDoubleClick={() => setUpdating(true)}>
            <div key={announcement._id}
                className={styles.element}>
                {announcement.attachments.length > 0 &&
                    <> {announcement.attachments.length <= 2
                        ? <div className={styles.attachments}>
                            <ImgAlbum images={announcement.attachments} />
                        </div>
                        : <ImgAlbum images={announcement.attachments}
                            Stab={({ onClick }) => (
                                <div className={styles.stab} onClick={onClick}>
                                    <span>{announcement.attachments.length}</span>
                                    <span> Photos </span>
                                </div>
                            )} />
                    } </>
                }
                {announcement.text &&
                    <p className={styles.text}> {announcement.text} </p>
                }
                {updating && announcementContentModalRoot &&
                    ReactDOM.createPortal(
                        <div className="modal" onMouseDown={() => setUpdating(false)}>
                            <ChangeContent
                                initState={announcement}
                                confirm={(newContent) => { updateAnnouncement(announcement._id, newContent); setUpdating(false) }}
                                reject={() => setUpdating(false)}
                            />
                        </div>,
                        announcementContentModalRoot)
                }
            </div>
            <div className={styles.controls}>
                <Options
                    include={[redactorOptions.change, redactorOptions.delete]}
                    props={{
                        [redactorOptions.change]: {
                            onClick: () => setUpdating(true),
                            className: `${styles.pen}`,
                            size: 15,
                        },
                        [redactorOptions.delete]: {
                            onClick: () => removeAnnouncement(announcement._id),
                            className: `${styles.remove}`,
                            size: 20,
                        }
                    }}
                    withRoleControl
                />
            </div>
        </div>
    )
}

type CreateAnnouncementModalProps = {
    initContent?: Partial<announcement>
    returnAnnouncement: (hw: Omit<announcement, "_id">) => void
    close: () => void
}
const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({ returnAnnouncement, close, initContent = {} }) => {
    if (announcementContentModalRoot) {
        return ReactDOM.createPortal(
            <div className={"modal"} onMouseDown={close}>
                <ChangeContent
                    initState={initContent}
                    confirm={(content) => { returnAnnouncement(content); close() }}
                    reject={close}
                />
            </div>
            , announcementContentModalRoot)
    }
    return null;
}

const Add: React.FC<{ onClick: (e: React.MouseEvent<SVGElement, MouseEvent>) => void }> = ({ onClick }) => {
    return <Options
        include={redactorOptions.add}
        props={{
            [redactorOptions.add]: {
                className: styles.addContent,
                size: 30,
                onClick,
                allowOnlyRedactor: true
            }
        }}
    />
}

export default AnnouncementsSection