import React, { useState } from 'react'
import styles from './InfoSection.module.css'
import { FaFilter } from "react-icons/fa";
import Searcher from '../../../Common/Searcher';
import ReactElement from 'react';
import Accordion from '../../../Common/Accordion';
import { GoTriangleRight } from "react-icons/go";

type Props = {
    name: string
    className?: string
    updateSearchString?: (str: string) => void,
    children: ((str: string) => (JSX.Element | false)) | JSX.Element
}
//Todo make searchinput component
const InfoSection: React.FC<Props> = ({ name, children, className = "", updateSearchString }) => {
    const [text, setText] = useState("");

    return (
        <div className={styles.section}>
            <Accordion
                Head={({ onClick, opened }) =>
                    <div onClick={onClick} className={styles.header}>
                        <div className={styles.name}>
                            <div> {name}</div>
                            <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={15} />
                        </div>
                        {updateSearchString &&
                            <Searcher changeHandler={str => (setText(str), updateSearchString(str))} />
                        }
                    </div>}
                Body={() => <div className={`${styles.content} ${className}`}>
                    {children && typeof children === "function" ? children(text) : children}
                </div>}
            />
        </div>
    )
}

export default InfoSection