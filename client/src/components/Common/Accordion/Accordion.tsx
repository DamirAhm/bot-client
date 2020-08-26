import React, { useState, HTMLAttributes } from 'react';
import { useEffect } from "react";
type Props = {
    Head: React.FC<{ opened: boolean }> | JSX.Element
    children: JSX.Element | ((opened: boolean) => JSX.Element)
    initiallyOpened?: boolean
    isOpened?: boolean
} & HTMLAttributes<HTMLDivElement>

const Accordion: React.FC<Props> = ({ Head, children, initiallyOpened, isOpened, ...attributes }) => {
    const [opened, setOpened] = useState(initiallyOpened ?? true);

    useEffect(() => {
        console.log(isOpened);
        if (isOpened !== undefined) setOpened(isOpened);
    }, [isOpened])

    return (
        <div {...attributes}>
            <div className="accordion" onClick={() => setOpened(!opened)}>
                {typeof Head === "function"
                    ? <Head opened={opened} />
                    : Head
                }
            </div>
            {opened &&
                <>{children && typeof children === "function" ? children(opened) : children}</>
            }
        </div>
    )
}

export default React.memo(Accordion)