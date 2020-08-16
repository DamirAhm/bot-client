import React from 'react'
import styles from "./OpenableImage.module.css"
import { MdClose } from "react-icons/md"
import OpenableImg from "./OpenableImage"
type Props = {
  attachment: string, 
  remove: () => void 
}

const DeletableAttachment: React.FC<Props> = ({ attachment, remove }) => {
    return (
        <div className={styles.deletableAttachment}>
            <OpenableImg src={attachment} alt="вложение" />
            <MdClose size={20} onClick={remove} className={styles.removeAttachment + " negative"} />
        </div>
    )
}

export default DeletableAttachment;