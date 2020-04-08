import React, { useState, HTMLAttributes } from 'react';
type Props = {
    Head: React.FC<{ onClick: () => void, opened: boolean }>
    Body: React.FC<{ opened: boolean }>
} & HTMLAttributes<HTMLDivElement>

const Accordion: React.FC<Props> = ({ Body, Head, children, ...attributes }) => {
    const [opened, setOpened] = useState(true);

    return (
        <div {...attributes}>
            <Head onClick={() => { setOpened(!opened) }} opened={opened} />
            {opened &&
                <Body opened={opened} />
            }
        </div>
    )
}

export default Accordion