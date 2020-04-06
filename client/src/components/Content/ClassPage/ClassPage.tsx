import React from 'react'
import styles from './ClassPage.module.css'
import { IoIosTrash } from "react-icons/io";
import StudentsSection from "./Sections/StudentSection/StudentsSection";
import ScheduleSection from "./Sections/ScheduleSection/ScheduleSection";

type Props = {
    className: string
}

const ClassPage: React.FC<Props> = ({ className }) => {

    return (
        <div className={styles.class}>
            <div className={styles.header}>
                <div className={styles.className}> {className} </div>
                <IoIosTrash size={30} className="remove" />
            </div>
            <div className={styles.content}>
                <StudentsSection className={className} />
                <ScheduleSection className={className} />
            </div>
        </div>
    )
}

export default ClassPage