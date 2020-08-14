import React, { useState, HTMLAttributes } from 'react';
import { useEffect } from "react";
type Props = {
    Head: React.FC<{ onClick: () => void, opened: boolean }> | JSX.Element
    Body: React.FC<{ opened: boolean }> | JSX.Element
    initiallyOpened?: boolean
    isOpened?: boolean
} & HTMLAttributes<HTMLDivElement>
 
const Accordion: React.FC<Props> = ({ Body, Head, children, initiallyOpened, isOpened, ...attributes }) => {
    const [opened, setOpened] = useState(initiallyOpened ?? true);

    useEffect(() => {
        if (isOpened !== undefined) setOpened(isOpened);
    }, [isOpened])

    return (
        <div {...attributes}>
            <div className="accordion">
                {typeof Head === "function"
                    ? <Head onClick={() => setOpened(!opened)} opened={opened} />
                    : Head
                }
            </div>
            {opened &&
                <>{typeof Body === "function"
                    ? <Body opened={opened} />
                    : Body
                }</>
            }
        </div>
    )
}

export default React.memo(Accordion)