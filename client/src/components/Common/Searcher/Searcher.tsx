import React from 'react'
import { MdClose } from "react-icons/md"
import styles from "./Searcher.module.css";

type Props = {
    onChange: (e: string) => void,
    value: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">

const Searcher: React.FC<Props> = ({ onChange, value, ...props }) => {
    const inputRef = React.createRef<HTMLInputElement>()

    const clear = () => {
        onChange("");
    }

    return (
        <div className={styles.container} onClick={e => e.stopPropagation()}>
            <input
                data-testid="input"
                ref={inputRef} className={styles.input}
                type="text" value={value}
                onChange={e => onChange(e.target.value)}
                {...props}
            />
            <button>
                <MdClose data-testid="clear-btn" onClick={clear} className={`${styles.clear} negative`} size={15} />
            </button>
        </div>
    )
}

export default React.memo(Searcher)