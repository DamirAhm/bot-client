import React, { useState } from 'react';
type Props = {
    Head: React.FC<{ onClick: () => void, opened: boolean }>
    Body: React.FC<{ opened: boolean }>
}

const Accordion: React.FC<Props> = ({ Body, Head }) => {
    const [opened, setOpened] = useState(true);

    return (
        <>
            <Head onClick={() => { setOpened(!opened) }} opened={opened} />
            {opened &&
                <Body opened={opened} />
            }
        </>
    )
}

export default Accordion