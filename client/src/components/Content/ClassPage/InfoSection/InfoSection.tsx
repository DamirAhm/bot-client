import React, { useState } from 'react'
import styles from './InfoSection.module.css'
import Searcher from '../../../Common/Searcher/Searcher';
import Accordion from '../../../Common/Accordion/Accordion';
import { GoTriangleRight } from "react-icons/go";

type Props = {
    name: string
    className?: string
    updateSearchString?: (str: string) => void
    children: ((str: string) => (JSX.Element | false)) | JSX.Element
    Header?: React.FC<{ opened: boolean, onClick: () => void }>
    defaultSearchString?: string
}

const InfoSection: React.FC<Props> = ({ name, children, className = "", updateSearchString, Header, defaultSearchString: text = "" }) => {
    const [opened, setOpened] = useState(true);

    const onClick = () => setOpened(!opened);

    return (
        <div className={styles.section}>
            <Accordion
                Head={
                    <>{Header
                        ? <Header onClick={onClick} opened={opened} />
                        : <div onClick={onClick} className={styles.header}>
                            <div className={styles.name}>
                                <div> {name}</div>
                                <GoTriangleRight className={opened ? styles.triangle_opened : ""} size={15} />
                            </div>
                            {updateSearchString &&
                                <Searcher
                                    value={text} placeholder="Поиск"
                                    onChange={text => updateSearchString(text)} />
                            }
                        </div>
                    } </>
                }
            >
                <div className={`${styles.content} ${className}`}>
                    {children && typeof children === "function" ? children(text) : children}
                </div>
            </Accordion>
        </div>
    )
}

export default React.memo(InfoSection);