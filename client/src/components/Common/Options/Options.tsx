import React, { useContext } from 'react';
import { UserContext } from '../../../App';

import { FaPen } from 'react-icons/fa';
import { MdClose, MdCheck, MdAdd, MdExitToApp, MdSettings } from 'react-icons/md';
import { GoPin } from 'react-icons/go';
import { IoIosTrash } from 'react-icons/io';
import { MdFileUpload } from 'react-icons/md';

import { IconBaseProps, IconType } from 'react-icons/lib';
import { redactorOptions, roles } from '../../../types';

type includeProps =
	| { include: redactorOptions; props?: IconBaseProps & iconSpecialProps }
	| { include: redactorOptions[]; props?: { [key: string]: IconBaseProps & iconSpecialProps } };

type Props = {
	withRoleControl?: boolean;
	allowOnlyAdmin?: boolean;
} & includeProps &
	IconBaseProps;

export type iconSpecialProps = {
	allowOnlyAdmin?: boolean;
	allowOnlyRedactor?: boolean;
	renderIf?: () => boolean;
};

const OptionsElements = {
	[redactorOptions.delete]: IoIosTrash,
	[redactorOptions.change]: FaPen,
	[redactorOptions.confirm]: MdCheck,
	[redactorOptions.reject]: MdClose,
	[redactorOptions.add]: MdAdd,
	[redactorOptions.exit]: MdExitToApp,
	[redactorOptions.pin]: GoPin,
	[redactorOptions.settings]: MdSettings,
	[redactorOptions.upload]: MdFileUpload,
};

const isSoloIconProps = (
	props: { [key: string]: IconBaseProps & iconSpecialProps } | (IconBaseProps & iconSpecialProps),
): props is IconBaseProps & iconSpecialProps => {
	const options = Object.values(redactorOptions);
	const keys = Object.keys(props);

	let flag = true;

	for (const opt of options) {
		if (keys.includes(opt)) flag = false;
	}

	return flag;
};

const Options: React.FC<Props> = ({
	include,
	props,
	withRoleControl = false,
	allowOnlyAdmin = false,
	...iconProps
}) => {
	if (typeof include === 'string') {
		props = { [include]: props };
		include = [include] as redactorOptions[];
	}

	const { role = roles.student } = useContext(UserContext);

	if (
		withRoleControl &&
		(role !== roles.contributor || (role === roles.contributor && !allowOnlyAdmin)) &&
		role !== roles.admin
	) {
		return null;
	}

	return (
		<>
			{include.map((e, i) => {
				if (props && isSoloIconProps(props)) {
					throw new Error(
						'If you pass props for one icon you must pass string of icon, not an array',
					);
				}

				const { allowOnlyAdmin, allowOnlyRedactor, renderIf, onClick, ...restProps } =
					props?.[e] || {};

				if (
					(allowOnlyRedactor && ![roles.admin, roles.contributor].includes(role)) ||
					(allowOnlyAdmin && role !== roles.admin) ||
					(renderIf && !renderIf())
				)
					return null;
				return (
					<button
						style={{ cursor: 'pointer' }}
						className={restProps.className}
						key={i}
						onClick={(onClick as any) || (() => {})}
					>
						{React.createElement(OptionsElements[e], {
							...iconProps,
							...restProps,
							className: `${iconProps.className || ''} ${restProps.className || ''}`,
							['data-testid']: e,
						})}
					</button>
				);
			})}
		</>
	);
};

export default React.memo(Options);
