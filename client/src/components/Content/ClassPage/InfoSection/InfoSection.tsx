import React from 'react'
import styles from './InfoSection.module.css'
import { FaFilter } from "react-icons/fa";

type Props = {
    name: string
    className?: string
    updateSearchString?: (str: string) => void
}
//Todo make searchinput component
const InfoSection: React.FC<Props> = ({ name, children, className = "", updateSearchString }) => {

    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <div className={styles.name}> {name}</div>
                {updateSearchString &&
                    <input type="text" className={styles.search} onChange={e => updateSearchString(e.target.value)} />
                }
            </div>
            <div className={`${styles.content} ${className}`}>
                {children}
            </div>
        </div>
    )
}

export default InfoSection