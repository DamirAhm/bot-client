import React, { useReducer, ChangeEvent, useState } from 'react'
import { MdClose, MdCheck, MdFileUpload } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { content, attachment, WithTypename, vkPhoto } from '../../../types';

import styles from './ChangeContent.module.css'
import OpenableImg from "../OpenableImage/OpenableImage";
import FileUploader from "../FileUploader";
import { useParams } from "react-router-dom";
import ConfirmReject from "../ConfirmReject";

type Props = {
    content: content
    contentChanger?: (newContent: content) => void
    closer?: () => void
    onChangeText?: (newText: string) => void
    onAddAttachment?: (newAttachments: WithTypename<attachment>) => void
    onRemoveAttachment?: (attachmentId: string) => void
    onChangeTo?: (newTo: Date) => void
    withConfirm?: boolean
};

const CHANGE_TEXT = "CHANGE_TEXT";
const REMOVE_ATTACHMENT = "REMOVE_ATTACHMENT";
const ADD_ATTACHMENT = "ADD_ATTACHMENT";
const CHANGE_TO = "CHANGE_TO";

const reducer = (state: content, action: ActionType): content => {
    switch (action.type) {
        case CHANGE_TEXT: {
            return {
                ...state,
                text: action.payload
            }
        }
        case REMOVE_ATTACHMENT: {
            return {
                ...state,
                attachments: state.attachments.filter(att => att._id !== action.payload)
            }
        }
        case ADD_ATTACHMENT: {
            return {
                ...state,
                attachments: [...state.attachments, action.payload]
            }
        }
        case CHANGE_TO: {
            return {
                ...state,
                to: action.payload.toISOString()
            }
        }
        default: {
            return state;
        }
    }
}

const actions = {
    changeText: (newText: string): { type: typeof CHANGE_TEXT, payload: string } => ({ type: CHANGE_TEXT, payload: newText }),
    removeAttachment: (attachmentIndex: string): { type: typeof REMOVE_ATTACHMENT, payload: string } => ({ type: REMOVE_ATTACHMENT, payload: attachmentIndex }),
    addAttachment: (attachment: WithTypename<attachment>): { type: typeof ADD_ATTACHMENT, payload: WithTypename<attachment> } => ({ type: ADD_ATTACHMENT, payload: attachment }),
    changeTo: (newTo: Date): { type: typeof CHANGE_TO, payload: Date } => ({ type: CHANGE_TO, payload: newTo })
}

type ActionType =
    | { type: typeof CHANGE_TEXT, payload: string }
    | { type: typeof REMOVE_ATTACHMENT, payload: string }
    | { type: typeof ADD_ATTACHMENT, payload: WithTypename<attachment> }
    | { type: typeof CHANGE_TO, payload: Date }


const parseAttachment = (photo: vkPhoto) => {
    return `photo${photo.owner_id}_${photo.id}`;
};
const findMaxPhotoResolution = (photo: vkPhoto) => photo.sizes.reduce<{ url: string, height: number }>((acc, c) => c.height > acc.height ? c : acc, { height: 0, url: "" }).url;

const ChangeContent: React.FC<Props> = ({ content, contentChanger, closer, onChangeTo, onChangeText, onAddAttachment, onRemoveAttachment, withConfirm = true }) => {
    const [newContent, dispatch] = useReducer(reducer, content);

    const { className } = useParams();

    const onPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files
            if (files) {
                const fd = new FormData();
                for (let i = 0; i < files.length; i++) {
                    fd.append("newAttachment", files[i]);
                }

                const { photos }: { photos: vkPhoto[] } = await fetch(
                    document.location.hostname === "localhost"
                        ? "http://localhost:8080/saveAttachment"
                        : document.location.origin.endsWith("/")
                            ? document.location.origin + `saveAttachment?className=${className}&type=homework&id=${content._id}`
                            : document.location.origin + `/saveAttachment?className=${className}&type=homework&id=${content._id}`,
                    {
                        method: "POST",
                        body: fd,
                        headers: {
                            "accepts": "application/json"
                        }
                    }
                ).then(res => res.json());

                const newAttachments: WithTypename<attachment>[] = photos.map((photo, i) => ({
                    url: findMaxPhotoResolution(photo),
                    value: parseAttachment(photo),
                    _id: i + Date.now().toString(),
                    __typename: "ClassHomeworkAttachment"
                }));

                for (const attachment of newAttachments) {
                    dispatch(actions.addAttachment(attachment))
                    if (onAddAttachment) onAddAttachment(attachment);
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    const checkUnEmptyContent = () => {
        return newContent.attachments.length > 0 || newContent.text.trim() !== "";
    }

    return (
        <div className={styles.contentChanger} onMouseDown={e => e.stopPropagation()}>
            {withConfirm 
            ? <>{ contentChanger && closer && checkUnEmptyContent()
                ? <ConfirmReject
                    confirm={
                        JSON.stringify(content) === JSON.stringify(newContent)
                            ? closer
                            : () => (contentChanger(newContent), closer())}
                    reject={closer}
                    className={styles.header}
                />
                    : <div style={{ width: "100%", height: "25px", marginBottom: "10px" }}></div> 
                }</>
                : <div></div> 
            }
            <section className={styles.date}>
                <h1 className={styles.title}> Дата </h1>
                <DatePicker
                    selected={new Date(Date.parse(newContent.to))}
                    onChange={date => {
                        if (date !== null) {
                            dispatch(actions.changeTo(date))
                            if (onChangeTo) onChangeTo(date)
                        }
                    }}
                    minDate={new Date()}
                    dateFormat={"dd/MM/yyyy"}
                    className={styles.datePickerInput}
                    showPopperArrow={false}
                    calendarClassName={styles.datePickerCalendar}
                />
            </section>
            <section className={styles.attachments}>
                <div className={styles.header}>
                    <h1 className={styles.title}> Вложения </h1>
                    <FileUploader View={() => <MdFileUpload size={25} className={styles.uploaderIcon} />} onChange={onPhotoUpload} />
                </div>
                <div className={styles.attachmentsContainer}>
                    {
                        newContent.attachments.map(att =>
                            <DeletableAttachment
                                key={att._id}
                                attachment={att.url}
                                remove={() => (dispatch(actions.removeAttachment(att._id)), onRemoveAttachment && onRemoveAttachment(att._id))} />)
                    }
                </div>
            </section>
            <section className={styles.text}>
                <h1 className={styles.title}> Домашняя работа </h1>
                <textarea
                    name="text" value={newContent.text}
                    className={styles.text} onChange={e => (dispatch(actions.changeText(e.target.value)), onChangeText && onChangeText(e.target.value))}
                    cols={60} rows={5}
                >
                    {content.text}
                </textarea>
            </section>
        </div>
    )
}

export const DeletableAttachment: React.FC<{ attachment: string, remove: () => void }> = ({ attachment, remove }) => {
    return (
        <div className={styles.deletableAttachment}>
            <OpenableImg src={attachment} alt="вложение" />
            <MdClose size={20} onClick={remove} className={styles.removeAttachment + " negative"} />
        </div>
    )
}

export default ChangeContent;

