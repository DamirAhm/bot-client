import React from 'react'
import { attachment } from "../../../types";
import OpenableImg, { OpenableImgProps, ImgStab } from "./OpenableImage";
import styles from "./OpenableImage.module.css";
type Props = {
  images: attachment[]
  Stab?: React.FC<React.HTMLAttributes<HTMLDivElement> & { onClick: () => void }> 
}

const connectImages: (atts: attachment[]) => (OpenableImgProps & {_id: string})[] = (attachments) => {
    const parsedAttachments: (OpenableImgProps & {_id: string})[] = [];

    for (let i = 0; i < attachments.length; i++) {
        const newImgProps: (OpenableImgProps & {_id: string}) = {} as (OpenableImgProps & {_id: string});
        newImgProps.src = attachments[i].url;
        newImgProps._id = attachments[i]._id;
        parsedAttachments.push(newImgProps);
    }
    if (parsedAttachments.length > 1) {
        for (let i = 0; i < parsedAttachments.length; i++) {
            if (i + 1 < parsedAttachments.length) {
                parsedAttachments[i].nextImg = parsedAttachments[i + 1];
            } else {
                parsedAttachments[i].nextImg = parsedAttachments[0];
            }
            if (i - 1 >= 0) {
                parsedAttachments[i].prevImg = parsedAttachments[i - 1];
            } else {
                parsedAttachments[i].prevImg = parsedAttachments[parsedAttachments.length - 1];
            }
        }
    }
    return parsedAttachments;
}

const ImgAlbum: React.FC<Props> = ({images, Stab}) => {
    const parsedImages = connectImages(images);
    
    return (
        <>{Stab 
            ? <ImgStab
                {...parsedImages[0]}
                Stab={Stab} />
            : <>{
                parsedImages.map(
                    (at, i) => <OpenableImg key={at._id} className={styles.attach} alt="Фото дз" {...parsedImages[i]} />
                )}
            </>
        }</>
    )
}

export default ImgAlbum;