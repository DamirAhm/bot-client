import React, { ChangeEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { content, attachment, redactorOptions } from '../../../types';

import styles from './ChangeContent.module.css';
import FileUploader from '../FileUploader/FileUploader';
import DeletableAttachment from '../OpenableImage/DeletableAttachment';
import createContentFiller, {
	ContentSectionProps,
} from '../../../utils/createContentChanger/createContentChanger';
import Options from '../Options/Options';

import { uploadPhoto } from '../../../utils/functions';
import Placeholder from '../Placeholder';

type persistentState = {
	placeholdersCount: number;
};

type changableContent = Pick<content, 'to' | 'attachments' | 'text'>;
export type ChangeContentPropsType = {
	[K in keyof changableContent]: ContentSectionProps<changableContent[K], persistentState>;
};

export const ChangeContentProps: ChangeContentPropsType = {
	to: {
		title: 'Дата',
		ContentComponent: ({ changeHandler, value }) => {
			const onChange = (newDate: string) => {
				changeHandler(newDate);

				const prevSavedValue = JSON.parse(
					localStorage.getItem('initAnnouncementContent') ?? '{}',
				);
				localStorage.setItem(
					'initAnnouncementContent',
					JSON.stringify({ ...prevSavedValue, to: newDate }),
				);
			};

			return (
				<DatePicker
					selected={new Date(value)}
					onChange={(date) => {
						if (date !== null) {
							onChange(date.toISOString());
						}
					}}
					minDate={new Date()}
					dateFormat={'dd/MM/yyyy'}
					className={styles.datePickerInput}
					showPopperArrow={false}
					calendarClassName={styles.datePickerCalendar}
				/>
			);
		},
		defaultValue: new Date().toISOString(),
		validator: (date) => {
			if (+date >= Date.now()) return 'Дата на которую задано задание должно быть в будущем';
		},
	},
	attachments: {
		Header: ({ changeHandler, value, setPersistentState, persistentState }) => {
			const uploadHandler = async (e: ChangeEvent<HTMLInputElement>) => {
				setPersistentState({
					...persistentState,
					placeholdersCount: persistentState.placeholdersCount + 1,
				});

				const newAttachments = await uploadPhoto(e.target.files);

				if (newAttachments) {
					setPersistentState({
						...persistentState,
						placeholdersCount: Math.max(persistentState.placeholdersCount - 1, 0),
					});

					changeHandler([...value, ...newAttachments]);

					const prevSavedValue = JSON.parse(
						localStorage.getItem('initAnnouncementContent') ?? '{}',
					);
					localStorage.setItem(
						'initAnnouncementContent',
						JSON.stringify({
							...prevSavedValue,
							attachments: [...value, ...newAttachments],
						}),
					);
				}
			};

			return (
				<div className={styles.header}>
					<h1 className={styles.title}> Вложения </h1>
					<FileUploader
						View={
							<Options
								include={redactorOptions.upload}
								size={25}
								className={styles.uploaderIcon}
							/>
						}
						onChange={uploadHandler}
					/>
				</div>
			);
		},
		ContentComponent: ({ value, changeHandler, persistentState }) => {
			const placeholders = Array.from(
				{ length: persistentState.placeholdersCount },
				function () {
					return (
						<Placeholder
							key={Date.now()}
							width={Math.floor(Math.random() * 200) + 400}
						/>
					);
				},
			);

			const onDelete = (_idToRemove: string) => {
				const updatedAttachments = value.filter(({ _id }) => _id !== _idToRemove);

				changeHandler(updatedAttachments);

				const prevSavedValue = JSON.parse(
					localStorage.getItem('initAnnouncementContent') ?? '{}',
				);
				localStorage.setItem(
					'initAnnouncementContent',
					JSON.stringify({
						...prevSavedValue,
						attachments: updatedAttachments,
					}),
				);
			};

			return (
				<div className={styles.attachmentsContainer}>
					{value.map((att: attachment) => (
						<DeletableAttachment key={att._id} attachment={att} remove={onDelete} />
					))}
					{placeholders}
				</div>
			);
		},
		defaultValue: [],
		validator: (_, persistentState) => {
			if (persistentState.placeholdersCount > 0) {
				return 'Подождите пока загружаются вложения';
			}

			return;
		},
	},
	text: {
		title: 'Домашняя работа',
		ContentComponent: ({ value, changeHandler }) => {
			const onChange = (newText: string) => {
				changeHandler(newText);

				const prevSavedValue = JSON.parse(
					localStorage.getItem('initAnnouncementContent') ?? '{}',
				);
				localStorage.setItem(
					'initAnnouncementContent',
					JSON.stringify({ ...prevSavedValue, text: newText }),
				);
			};

			return (
				<textarea
					autoFocus
					name="text"
					value={value}
					className={styles.text}
					onChange={(e) => {
						onChange(e.target.value);
					}}
					rows={5}
				>
					{value}
				</textarea>
			);
		},
		defaultValue: '',
	},
};

const ChangeContent = createContentFiller<persistentState, ChangeContentPropsType>(
	ChangeContentProps,
	{
		placeholdersCount: 0,
	},
	(state) => {
		if (state.text.trim() === '' && state.attachments.length === 0) {
			return 'Задание должно содержать текст или фотографии';
		}
	},
);

export default ChangeContent;
