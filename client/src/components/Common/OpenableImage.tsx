import React, { ImgHTMLAttributes, useState } from 'react'
import HTMLAttributes from 'react';
import ReactDOM from "react-dom";

const OpenableImg: React.FC<ImgHTMLAttributes<HTMLImageElement>> = ({ ...props }) => {
    const [modalOpened, setModalOpened] = useState(false);

    const photoModal = document.getElementById("photoModal");

    return (
        <>
            <img {...props} onClick={() => setModalOpened(true)} />
            {modalOpened && photoModal &&
                ReactDOM.createPortal(<ModalImg close={() => setModalOpened(false)} {...props} />, photoModal)
            }
        </>
    )
}

const ModalImg: React.FC<ImgHTMLAttributes<HTMLImageElement> & { close: () => void }> = ({ close, ...props }) => {
    return <div className="modal" onClick={close}>
        <img style={{ height: "70%" }} {...props} onClick={e => e.stopPropagation()} />
    </div>
}

export default OpenableImg;