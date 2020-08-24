import React from 'react'
import ReactDOM from 'react-dom'
import styles from './Confirm.module.css'


type Props = {
    text?: string,
    returnRes?: (res: boolean) => void
    onConfirm?: () => void
    onReject?: () => void
    confirmElement?: JSX.Element,
    rejectElement?: JSX.Element
}

const Confirm: React.FC<Props> = ({
    text = "Вы уверены что хотите совершить это действие", returnRes,
    confirmElement, onConfirm, onReject, rejectElement
}) => {
    const modalRoot = document.querySelector("#confirmModal");

    const chooseHandler = (res: boolean) => {
        if (res) onConfirm?.()
        else onReject?.()

        returnRes?.(res);
    }

    return modalRoot && ReactDOM.createPortal(
        <div className={"modal"}>
            <div className={styles.container}>
                <span className={styles.text}>{text}</span>
                <div className={styles.options}>
                    {confirmElement
                        ? rejectElement
                        : <button onClick={() => chooseHandler(false)} data-testid={"reject"} className={`${styles.btn} ${styles.reject}`}>Нет</button>
                    }
                    {rejectElement
                        ? confirmElement
                        : <button onClick={() => chooseHandler(true)} data-testid={"confirm"} className={`${styles.btn} ${styles.confirm}`}>Да</button>
                    }
                </div>
            </div>
        </div>,
        modalRoot
    )
}

export default Confirm