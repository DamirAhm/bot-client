import React from 'react'
import { MdClose } from "react-icons/md"
import styles from "./Searcher.module.css";

type Props = {
    changeHandler: (str: string) => void,
    text: string
}

const Searcher: React.FC<Props> = ({ changeHandler, text }) => {
    return (
        <div className={styles.container} onClick={e => e.stopPropagation()}>
            <input data-testid="input" className={styles.input} type="text" value={text} onChange={e => changeHandler(e.target.value)} />
            <button>
                <MdClose data-testid="clear-btn" onClick={() => changeHandler("")} className={`${styles.clear} negative`} size={15} />
            </button>
        </div>
    )
}

export default React.memo(Searcher)