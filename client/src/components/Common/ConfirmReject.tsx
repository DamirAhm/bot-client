import React from 'react'
import { MdClose, MdCheck } from "react-icons/md"
type Props = {
    confirm: () => void
    reject: () => void
} & React.HTMLAttributes<HTMLDivElement>

const ConfirmReject: React.FC<Props> = ({ confirm, reject, ...props }) => {
    return (
        <div style={{ width: '100%', display: "flex", justifyContent: "space-between" }} {...props}>
            <MdClose size={25} className={"negative"} onClick={reject} />
            <MdCheck size={25} className={"positive"} onClick={confirm} />
        </div>
    )
}

export default ConfirmReject