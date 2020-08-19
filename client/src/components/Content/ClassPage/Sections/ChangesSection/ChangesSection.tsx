import React, { useState } from 'react'
import styles from '../Common/ContentSection.module.css'
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { content, attachment, WithTypename, change, redactorOptions } from '../../../../../types';
import Suspender from '../../../../Common/Suspender';
import Accordion from "../../../../Common/Accordion";
import { GoTriangleRight } from "react-icons/go"; 
import ReactDOM from "react-dom";
import ChangeContent from "../../../../Common/ChangeContent/ChangeContent";
import ImgAlbum from "../../../../Common/OpenableImage/ImgAlbum";
import { parseContentByDate, getDateStrFromDayMonthStr } from "../../../../../utils/functions";
import Options from "../../../../Common/Options";
 
const changeContentModalRoot = document.getElementById('changeContentModal');

type Props = {
    className: string
}
type changeProps = {
    change: change
    removeChange: (chnageId: string | undefined) => void,
    updateChange: (changeId: string | undefined, updates: Partial<change>) => void
}

const GET_CHANGES = gql`
    query GetChanges($className: String!) {
        changes: getChanges(className: $className) {
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

const REMOVE_CHANGE = gql`
    mutation RemoveChange($className: String!, $changeId: String!) {
        removeChange(changeId: $changeId, className: $className)
    }
`

const UPDATE_CHANGE = gql`
    mutation UpdateChange($className: String!, $changeId: String!, $updates: ClassChangesInput!) {
        updateChange(className: $className, changeId: $changeId, updates: $updates) {
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

const ADD_CHANGE = gql`
    mutation addChange($className: String!, $text: String!, $to: String, $attachments: [ClassHomeworkAttachmentsInput]!) {
        addChange(className: $className, text: $text, to: $to, attachments: $attachments) {
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

const ChangesSection: React.FC<Props> = ({ className }) => {
    const [changeCreating, setChangeCreating] = useState(false);
    const [initContent, setInitContent] = useState({});
    const changesQuery = useQuery<{ changes: change[] }>(GET_CHANGES, { variables: { className } });

    const [removeChange] = useMutation<
        WithTypename<{
            removeChange: string
        }>,
        {
            className: string,
            changeId: string,
        }
    >(REMOVE_CHANGE);
    const [updateChange] = useMutation<
        WithTypename<{
            updateChange: WithTypename<Partial<change>>
        }>,
        {
            className: string,
            changeId: string,
            updates: Partial<Omit<change, "attachments"> & { attachments: attachment[] }>
        }>(UPDATE_CHANGE);

    const [addChange] = useMutation<
        WithTypename<{
            addChange: WithTypename<change>
        }>,
        {
            className: string,
            text: string,
            attachments: attachment[]
            to: string
        }
    >(ADD_CHANGE)

    const remove = (changeId: string | undefined) => {
        if (changeId) {
            removeChange({
                variables: { className, changeId },
                optimisticResponse: {
                    __typename: "Mutation",
                    removeChange: changeId
                },
                update: (proxy, res) => {
                    const data = proxy.readQuery<{ changes: change[] }>({ query: GET_CHANGES, variables: { className } });

                    if (res?.data) {
                        proxy.writeQuery({
                            query: GET_CHANGES,
                            variables: { className },
                            data: {
                                changes: data?.changes.filter(chng => chng._id !== changeId) || []
                            }
                        })
                    }
                }
            })
        }
    }
    const update = (changeId: string | undefined, updates: Partial<WithTypename<change>>) => {
        const {__typename, ...changeWithoutTypename} = updates;

        if (changeId) {
            updateChange({
                variables: { className, changeId, updates: { ...changeWithoutTypename, attachments: updates.attachments?.map(({ __typename, ...att }) => att) } },
                optimisticResponse: {
                    __typename: "Mutation",
                    updateChange: {
                        __typename: "ClassChange",
                        _id: changeId,
                        ...changesQuery?.data?.changes.find(hw => hw._id === changeId),
                        ...updates
                    }
                },
                update: (proxy, res) => {
                    const data = proxy.readQuery<{ changes: change[] }>({ query: GET_CHANGES, variables: { className } });

                    if (res?.data) {
                        proxy.writeQuery({
                            query: GET_CHANGES,
                            variables: { className },
                            data: {
                                homework: data?.changes.map(chng => chng._id === changeId ? res.data?.updateChange : chng) || []
                            }
                        })
                    }
                }
            })
        }
    }
    const add = (changeData: Omit<change, "_id">) => {
        addChange({
            variables: { ...changeData, className, attachments: changeData?.attachments?.map(({ __typename, ...att }) => att) },
            optimisticResponse: {
                __typename: "Mutation",
                addChange: {
                    ...changeData,
                    _id: Date.now().toString(),
                    __typename: "ClassChange"
                }
            },
            refetchQueries: [{
                query: GET_CHANGES,
                variables: { className }
            }]
        })
    }

    return (
        <>
            <InfoSection
                name='Домашняя работа'
                Header={({ opened, onClick }) =>
                    <div className={`${styles.sectionHeader} ${styles.contentHeader}`} onClick={onClick}>
                        <div className={styles.title}>
                            Изменения в расписании 
                            <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={15} />
                        </div>
                        <Add onClick={(e) => (e.stopPropagation(), setChangeCreating(true))} />
                    </div>}>
                <Suspender query={changesQuery}>
                    {(data: { changes: WithTypename<change>[] }) => {
                        const [_,parsedChanges] = parseContentByDate(data.changes);
                        return <div className={styles.content}>
                            {Object.keys(parsedChanges).map(changeDate =>
                                <Accordion
                                    key={changeDate}
                                    Head={({ onClick, opened }) => 
                                        <div className={styles.sectionHeader} onClick={onClick}>
                                            <div className={styles.title}>
                                                {changeDate}
                                                <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={15} />
                                            </div>
                                            <Add onClick={(e) => (
                                                e.stopPropagation(), 
                                                setChangeCreating(true),
                                                setInitContent({to: getDateStrFromDayMonthStr(changeDate)})
                                            )} />
                                        </div>
                                    }
                                >
                                    <>
                                        <div className={`${styles.elements} ${styles.offseted}`}>
                                            {parsedChanges[changeDate].map((change, i) => <Change updateChange={update} key={change._id} removeChange={remove} change={change} />)}
                                        </div>
                                    </>
                                </Accordion>
                            )}
                        </div>
                    }
                    }
                </Suspender>
            </InfoSection>
            {changeContentModalRoot && changeCreating &&
                ReactDOM.createPortal(
                    <CreateChangeModal
                        returnChange={add}
                        close={() => setChangeCreating(false)}
                        initContent={initContent}
                    />,
                    changeContentModalRoot
                )}
        </>
    )
}
const Change: React.FC<changeProps> = ({ change, removeChange, updateChange }) => {
    const [updating, setUpdating] = useState(false);

    return (
        <div className={`${styles.container} ${change.attachments.length === 2 ? styles.pair : ""}`} onDoubleClick={() => setUpdating(true)}>
            <div key={change._id}
                className={styles.element}>
                {change.attachments.length > 0 &&
                    <> {change.attachments.length <= 2
                        ? <div className={styles.attachments}>
                            <ImgAlbum images={change.attachments} />
                        </div>
                        : <ImgAlbum images={change.attachments} 
                            Stab={({ onClick }) => (
                                <div className={styles.stab} onClick={onClick}>
                                    <span>{change.attachments.length}</span>
                                    <span> Photos </span>
                                </div>
                            )}/>
                    } </>
                }
                {change.text &&
                    <p className={styles.text}> {change.text} </p>
                }
                {updating && changeContentModalRoot &&
                    ReactDOM.createPortal(
                        <div className="modal" onMouseDown={() => setUpdating(false)}>
                            <ChangeContent
                                initState={change}
                                confirm={(newContent) => (updateChange(change._id, newContent), setUpdating(false))}
                                reject={() => setUpdating(false)}
                            />
                        </div>,
                        changeContentModalRoot)
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
                            onClick: () => removeChange(change._id),
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

type CreateChangeModalProps = {
    initContent?: Partial<change>
    returnChange: (hw: Omit<change, "_id">) => void
    close: () => void
}
const CreateChangeModal: React.FC<CreateChangeModalProps> = ({ returnChange, close, initContent = {} }) => {
    if (changeContentModalRoot) {
        return ReactDOM.createPortal(
            <div className={"modal"} onMouseDown={close}>
                <ChangeContent
                    initState={initContent}
                    confirm={(content) => (returnChange(content), close)}
                    reject={close}
                />
            </div>
            , changeContentModalRoot)
    }
    return null;
}

const Add: React.FC<{onClick: (e: React.MouseEvent<SVGElement, MouseEvent>) => void}> = ({onClick}) => {
    return <Options 
        include={redactorOptions.add} 
        props={{
            [redactorOptions.add]: {
            className: styles.addContent,
            size: 30,
            onClick,
            allowOnlyRedactor: true
        }}}
    />
}

export default ChangesSection