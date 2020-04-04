import React from 'react'
import styles from './InfoSection.module.css'
import { FaFilter } from "react-icons/fa";

type Props = {
    name: string
    withSearch: boolean
    className?: string
    updateSearchString?: (str: string) => void
}
//Todo make searchinput component
const InfoSection: React.FC<Props> = ({ name, children, withSearch, className = "", updateSearchString }) => {
    if (withSearch && !updateSearchString) console.error("Don't use with search without updating wearch string!!!")
    return (
        <div className={styles.section}>
            <div className={styles.header}>
                <div className={styles.name}> {name}</div>
                {withSearch && updateSearchString &&
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