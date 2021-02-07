import React, { useState } from 'react';
import Options from '../../components/Common/Options/Options';
import { redactorOptions } from '../../types';

import styles from './ContentChanger.module.css';

type ContentSectionComponent<T, PS = object> = React.ComponentType<{
	changeHandler: (value: T) => void;
	value: T;
	state: { [key: string]: any };
	persistentState: PS;
	setPersistentState: (newState: PS) => void;
}>;

export type ContentSectionProps<T, PS extends object> = {
	title?: string;
	Header?: JSX.Element | ContentSectionComponent<T, PS>;
	ContentComponent: ContentSectionComponent<T, PS>;
	defaultValue?: T;
	validator?: (value: T, persistentState: PS) => string | undefined;
};
export type contentType<T extends ContentSectionProps<any, any>> = T extends ContentSectionProps<
	infer P,
	any
>
	? P
	: never;
export type stateType<T extends { [K: string]: ContentSectionProps<any, any> }> = {
	[K in keyof T]: contentType<T[K]>;
};

export type ContentChangerProps<T extends { [key: string]: any }> = {
	reject?: () => void;
	confirm?: (value: T) => void;
	final?: (value: T) => void;
	onChange?: (value: T, changed: string) => void;
	initState?: Partial<T>;
	sectionClassName?: string;
	titleClassName?: string;
	propsToSections?: { [key: string]: any };
};

const createContentFiller = <
	PS extends { [key: string]: Object },
	T extends { [K: string]: ContentSectionProps<any, PS> }
>(
	contentFillers: T,
	initialPersistentState: PS = {} as PS,
	validator?: (state: stateType<T>, persistentState: PS) => string | undefined,
): React.ComponentType<ContentChangerProps<stateType<T>>> => {
	return ({
		confirm,
		reject,
		final,
		onChange,
		initState = {} as Partial<stateType<T>>,
		sectionClassName,
		titleClassName,
		propsToSections,
	}) => {
		const stateFromDefaults: stateType<T> = Object.entries(contentFillers).reduce(
			(acc, [key, c]) => ({ ...acc, [key]: c.defaultValue }),
			{} as stateType<T>,
		);
		const [state, setState] = useState<stateType<T>>({ ...stateFromDefaults, ...initState });
		const [errors, setErrors] = useState<string[]>([]);

		const [persistentState, setPersistentState] = useState<PS>(initialPersistentState);

		const onConfirm = () => {
			const newErrors = [];

			for (const key in contentFillers) {
				if (contentFillers.hasOwnProperty(key)) {
					const { validator } = contentFillers[key];
					if (validator) {
						const validationResult = validator(state[key], persistentState);
						if (validationResult !== undefined) {
							newErrors.push(validationResult);
						}
					}
				}
			}

			if (validator) {
				const validationResult = validator(state, persistentState);
				if (validationResult !== undefined) {
					newErrors.push(validationResult);
				}
			}

			if (newErrors.length === 0) {
				confirm?.(state);
				final?.(state);
			} else {
				setErrors(newErrors);
			}
		};

		const onReject = () => {
			setErrors([]);
			setState({ ...stateFromDefaults, ...initState });
			reject?.();
			final?.(state);
		};

		return (
			<div className={styles.contentChanger} onMouseDown={(e) => e.stopPropagation()}>
				<div className={styles.header}>
					<Options
						include={[redactorOptions.reject, redactorOptions.confirm]}
						props={{
							[redactorOptions.confirm]: {
								onClick: onConfirm,
								className: 'positive',
								allowOnlyRedactor: true,
							},
							[redactorOptions.reject]: {
								onClick: onReject,
								className: 'negative',
							},
						}}
						style={{ cursor: 'pointer' }}
						size={25}
					/>
				</div>
				{Object.entries(contentFillers).map(
					([stateKey, { title, ContentComponent, Header }]) => (
						<section
							className={`${styles.section} ${sectionClassName || ''}`}
							key={stateKey}
						>
							{Header ? (
								<>
									{typeof Header === 'function' ? (
										<Header
											persistentState={persistentState}
											setPersistentState={setPersistentState}
											changeHandler={(value) => {
												setState({ ...state, [stateKey]: value });
												onChange?.(
													{ ...state, [stateKey]: value },
													stateKey,
												);
											}}
											value={state[stateKey]}
											state={state}
											{...propsToSections}
										/>
									) : (
										{ Header }
									)}
								</>
							) : (
								<h1 className={`${styles.title} ${titleClassName || ''}`}>
									{' '}
									{title}{' '}
								</h1>
							)}
							<ContentComponent
								persistentState={persistentState}
								setPersistentState={setPersistentState}
								changeHandler={(value) => {
									setState({ ...state, [stateKey]: value });
									onChange?.({ ...state, [stateKey]: value }, stateKey);
								}}
								value={state[stateKey]}
								state={state}
								{...propsToSections}
							/>
						</section>
					),
				)}
				<section className={styles.errorSection}>
					{errors.length > 0 && <span className={styles.error}> {errors[0]} </span>}
				</section>
			</div>
		);
	};
};

export default createContentFiller;
