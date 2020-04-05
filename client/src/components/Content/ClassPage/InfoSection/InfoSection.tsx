import React, { useState } from 'react'
import styles from './InfoSection.module.css'
import { FaFilter } from "react-icons/fa";
import Searcher from '../../../Common/Searcher';

type Props = {
    name: string
    className?: string
    updateSearchString?: (str: string) => void,
    children: ((JSX.Element | ((str: string) => JSX.Element) | false) | (false | JSX.Element))[]
}
//Todo make searchinput component
const InfoSection: React.FC<Props> = ({ name, children, className = "", updateSearchString }) => {
    const [text, setText] = useState("");

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <div className={styles.name}> {name}</div>
                {updateSearchString &&
                    <Searcher changeHandler={str => (setText(str), updateSearchString(str))} />
                }
            </div>
            <div className={`${styles.content} ${className}`}>
                {children.map(c => <>{typeof c === "function" ? c(text) : children}</>)}
            </div>
        </div>
    )
}

export default InfoSection