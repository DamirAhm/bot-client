import React, { useReducer } from 'react'
import { MdClose, MdCheck } from "react-icons/md";

import { content, attachment, WithTypename } from "../../../types"

import styles from './ChangeContent.module.css'
import { CHANGE_TEXT, REMOVE_ATTACHMENT, ADD_ATTACHMENT } from "./ReducerConstants";
import OpenableImg from "../OpenableImage";

type Props = {
    content: content
    contentChanger: (newContent: content) => void
    closer: () => void
};

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
        default: {
            return state;
        }
    }
}

const actions = {
    changeText: (newText: string): { type: typeof CHANGE_TEXT, payload: string } => ({ type: CHANGE_TEXT, payload: newText }),
    removeAttachment: (attachmentIndex: string): { type: typeof REMOVE_ATTACHMENT, payload: string } => ({ type: REMOVE_ATTACHMENT, payload: attachmentIndex }),
    addAttachment: (attachment: WithTypename<attachment>): { type: typeof ADD_ATTACHMENT, payload: WithTypename<attachment> } => ({ type: ADD_ATTACHMENT, payload: attachment })
}

type ActionType =
    | { type: typeof CHANGE_TEXT, payload: string }
    | { type: typeof REMOVE_ATTACHMENT, payload: string }
    | { type: typeof ADD_ATTACHMENT, payload: WithTypename<attachment> }

const ChangeContent: React.FC<Props> = ({ content, contentChanger, closer }) => {
    const [newContent, dispatch] = useReducer(reducer, content)

    const confirm = () => {
        if (JSON.stringify(content) === JSON.stringify(newContent)) {
            closer();
        } else {
            contentChanger(newContent);
        }
    }

    return (
        <div className="modal" onClick={closer}>
            <div className={styles.contentChanger} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <MdClose size={25} className={"negative"} onClick={closer} />
                    <MdCheck size={25} className={"positive"} onClick={() => confirm()} />
                </div>
                <section className={styles.attachments}>
                    <h1 className={styles.title}> Вложения </h1>
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

