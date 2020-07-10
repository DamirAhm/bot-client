import React, { ImgHTMLAttributes, useState, CSSProperties, HTMLAttributes } from 'react'
import ReactDOM from "react-dom";
import { MdNavigateBefore, MdNavigateNext } from "react-icons/md";
import styles from "./OpenableImage.module.css";

export type OpenableImgProps = {
    prevImg?: OpenableImgProps
    nextImg?: OpenableImgProps
    src: string
} & ImgHTMLAttributes<HTMLImageElement>;
type ModalImgProps = {
    close: () => void
} & OpenableImgProps
type changeImg = (img: { src: string, prevImg?: OpenableImgProps, nextImg?: OpenableImgProps }, e: React.MouseEvent<SVGElement, MouseEvent>) => void;

const OpenableImg: React.FC<OpenableImgProps> = ({ prevImg, nextImg, ...props }) => {
    const [modalOpened, setModalOpened] = useState(false);

    const photoModal = document.getElementById("photoModal");

    return (
        <>
            <img {...props} onClick={() => setModalOpened(true)} />
            {modalOpened && photoModal &&
                ReactDOM.createPortal(<ModalImg close={() => setModalOpened(false)} {...{ ...props, prevImg, nextImg }} />, photoModal)
            }
        </>
    )
}
export const ImgStab: React.FC<OpenableImgProps & { Stab: React.FC<HTMLAttributes<HTMLDivElement> & { onClick: () => void }> }> = ({ Stab, ...props }) => {
    const [modalOpened, setModalOpened] = useState(false);

    const photoModal = document.getElementById("photoModal");

    return (
        <>
            <Stab onClick={() => setModalOpened(true)} />
            {modalOpened && photoModal &&
                ReactDOM.createPortal(<ModalImg close={() => setModalOpened(false)} {...props} />, photoModal)
            }
        </>
    )
}

export const ModalImg: React.FC<ModalImgProps> = ({ close, nextImg, prevImg, ...props }) => {
    const [src, setSrc] = useState(props.src);
    const [prev, setPrev] = useState(prevImg);
    const [next, setNext] = useState(nextImg);

    const toImg: changeImg = ({ src, prevImg, nextImg }, e) => {
        e.stopPropagation()
        setSrc(src);
        setPrev(prevImg);
        setNext(nextImg);
    }

    return <div className="modal" onMouseDown={close}>
        {prev &&
            <MdNavigateBefore size={40} className={styles.prev} onMouseDown={(e) => toImg(prev, e)} />
        }
        <img style={{ width: "100%", maxWidth: "80vh" }} {...props} src={src} onMouseDown={e => e.stopPropagation()} />
        {next &&
            <MdNavigateNext size={40} className={styles.next} onMouseDown={(e) => toImg(next, e)} />
        }
    </div>
}

export default OpenableImg;