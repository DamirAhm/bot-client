import React, { useState, HTMLAttributes } from 'react';
import { useEffect } from 'react';
import useLocalStorage from '../../../hooks/useLocalStorage';
type Props = {
	Head: React.FC<{ opened: boolean }> | JSX.Element;
	children: JSX.Element | ((opened: boolean) => JSX.Element);
	initiallyOpened?: boolean;
	isOpened?: boolean;
	accordionId: string;
} & HTMLAttributes<HTMLDivElement>;

const Accordion: React.FC<Props> = ({
	Head,
	children,
	initiallyOpened,
	isOpened,
	accordionId,
	...attributes
}) => {
	const [opened, setOpened] = useLocalStorage<boolean>(accordionId, initiallyOpened ?? true);

	return (
		<div {...attributes}>
			<div className="accordion" onClick={() => setOpened(!opened)}>
				{typeof Head === 'function' ? <Head opened={!!opened} /> : Head}
			</div>
			{opened && (
				<>{children && typeof children === 'function' ? children(opened) : children}</>
			)}
		</div>
	);
};

export default React.memo(Accordion);
