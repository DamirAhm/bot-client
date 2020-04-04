import React from 'react'
import styles from './ClassPage.module.css'
import { IoIosTrash } from "react-icons/io";
import StudentsSection from "./Sections/StudentsSection";

type Props = {
    className: string
}

const ClassPage: React.FC<Props> = ({ className }) => {

    return (
        <div className={styles.class}>
            <div className={styles.header}>
                <div className={styles.name}> {className} </div>
                <IoIosTrash size={30} className="remove" />
            </div>
            <div className={styles.content}>
                <StudentsSection className={className} styles={styles} />
            </div>
        </div>
    )
}

export default ClassPage