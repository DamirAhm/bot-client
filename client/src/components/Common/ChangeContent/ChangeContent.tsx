import React, { useReducer, ChangeEvent, useState } from 'react'
import { MdClose, MdCheck, MdFileUpload } from "react-icons/md";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { content, attachment, WithTypename, vkPhoto } from "../../../types"

import styles from './ChangeContent.module.css'
import OpenableImg from "../OpenableImage";
import FileUploader from "../FileUploader";
import { useParams } from "react-router-dom";

type Props = {
    content: content
    contentChanger: (newContent: content) => void
    closer: () => void
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
            console.log(action.payload)
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

const ChangeContent: React.FC<Props> = ({ content, contentChanger, closer }) => {
    const [newContent, dispatch] = useReducer(reducer, content);

    const { className } = useParams();

    const confirm = () => {
        if (JSON.stringify(content) === JSON.stringify(newContent)) {
            closer();
        } else {
            contentChanger(newContent);
            closer();
        }
    }
    const onPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        try {
            const files = e.target.files
            if (files) {
                const fd = new FormData();
                for (let i = 0; i < files.length && i < 5; i++) {
                    fd.append("newAttachment", files[i]);
                }

                const { photos }: { photos: vkPhoto[] } = await fetch(
                    document.location.hostname === "localhost"
                        ? "http://localhost:4000/saveAttachment"
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
                )
                    .then(res => res.json());

                const newAttachments: WithTypename<attachment>[] = photos.map((photo, i) => ({
                    url: photo.sizes[5].url,
                    value: parseAttachment(photo),
                    _id: i + Date.now().toString(),
                    __typename: "ClassHomeworkAttachment"
                }));

                for (const attachment of newAttachments) {
                    dispatch(actions.addAttachment(attachment))
                }
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="modal" onClick={closer}>
            <div className={styles.contentChanger} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <MdClose size={25} className={"negative"} onClick={closer} />
                    <MdCheck size={25} className={"positive"} onClick={() => confirm()} />
                </div>
                <section className={styles.date}>
                    <span className={styles.title}> Дата </span>
                    <DatePicker
                        selected={new Date(Date.parse(newContent.to))}
                        onChange={date => date && dispatch(actions.changeTo(date))}
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
                            newContent.attachments.map(att => <DeletableAttachment key={att._id} attachment={att.url} remove={() => dispatch(actions.removeAttachment(att._id))} />)
                        }
                    </div>
                </section>
                <section className={styles.text}>
                    <h1 className={styles.title}> Домашняя работа </h1>
                    <textarea
                        name="text" value={newContent.text}
                        className={styles.text} onChange={e => dispatch(actions.changeText(e.target.value))}
                        cols={60} rows={5}
                        onSubmit={() => contentChanger(newContent)}>
                        {content.text}
                    </textarea>
                </section>
            </div>
        </div>
    )
}

const DeletableAttachment: React.FC<{ attachment: string, remove: () => void }> = ({ attachment, remove }) => {
    return (
        <div className={styles.deletableAttachment}>
            <OpenableImg src={attachment} alt="вложение" />
            <MdClose size={20} onClick={remove} className={styles.removeAttachment + " negative"} />
        </div>
    )
}

export default ChangeContent;

