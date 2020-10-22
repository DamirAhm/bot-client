import React, { ChangeEvent, useState } from 'react';
import { MdFileUpload } from 'react-icons/md';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { content, attachment, WithTypename, vkPhoto } from '../../../types';

import styles from './ChangeContent.module.css';
import FileUploader from '../FileUploader/FileUploader';
import DeletableAttachment from '../OpenableImage/DeletableAttachment';
import createContentFiller, {
	ContentSectionProps,
} from '../../../utils/createContentChanger/createContentChanger';
import Loader from '../Loader/Loader';

const parseAttachment = (photo: vkPhoto) => {
	return `photo${photo.owner_id}_${photo.id}`;
};
const findMaxPhotoResolution = (photo: vkPhoto) =>
	photo.sizes.reduce<{ url: string; height: number }>(
		(acc, c) => (c.height > acc.height ? c : acc),
		{ height: 0, url: '' },
	).url;

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
		ContentComponent: ({ changeHandler, value }) => (
			<DatePicker
				selected={new Date(value)}
				onChange={(date) => {
					if (date !== null) {
						changeHandler(date.toISOString());
					}
				}}
				minDate={new Date()}
				dateFormat={'dd/MM/yyyy'}
				className={styles.datePickerInput}
				showPopperArrow={false}
				calendarClassName={styles.datePickerCalendar}
			/>
		),
		defaultValue: new Date().toISOString(),
		validator: (date) => {
			if (+date >= Date.now()) return 'Дата на которую задано задание должно быть в будущем';
		},
	},
	attachments: {
		Header: ({ changeHandler, value, setPersistentState, persistentState }) => {
			const onPhotoUpload = async (e: ChangeEvent<HTMLInputElement>) => {
				try {
					const { files } = e.target;

					setPersistentState({
						...persistentState,
						placeholdersCount: persistentState.placeholdersCount + 1,
					});

					if (files) {
						const fd = new FormData();
						for (let i = 0; i < files.length; i++) {
							fd.append('newAttachment', files[i]);
						}

						const { photos }: { photos: vkPhoto[] } = await fetch(
							document.location.hostname === 'localhost'
								? 'http://localhost:8080/saveAttachment'
								: document.location.origin.endsWith('/')
								? document.location.origin + `saveAttachment`
								: document.location.origin + `/saveAttachment`,
							{
								method: 'POST',
								body: fd,
								headers: {
									accepts: 'application/json',
								},
							},
						).then((res) => res.json());

						setPersistentState({
							...persistentState,
							placeholdersCount: Math.max(persistentState.placeholdersCount - 1, 0),
						});

						const newAttachments: WithTypename<attachment>[] = photos.map(
							(photo, i) => ({
								url: findMaxPhotoResolution(photo),
								value: parseAttachment(photo),
								_id: i + Date.now().toString(),
								__typename: 'ClassHomeworkAttachment',
							}),
						);

						changeHandler([...value, ...newAttachments]);
					}
				} catch (e) {
					console.error(e);
				}
			};

			return (
				<div className={styles.header}>
					<h1 className={styles.title}> Вложения </h1>
					<FileUploader
						View={<MdFileUpload size={25} className={styles.uploaderIcon} />}
						onChange={onPhotoUpload}
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

			return (
				<div className={styles.attachmentsContainer}>
					{value.map((att: attachment) => (
						<DeletableAttachment
							key={att._id}
							attachment={att.url}
							remove={() => {
								changeHandler(value.filter(({ _id }) => _id !== att._id));
							}}
						/>
					))}
					{placeholders}
				</div>
			);
		},
		defaultValue: [],
		validator: (_, persistentState) => {
			if (persistentState.placeholdersCount >= 0) {
				return 'Подождите пока загружаются вложения';
			}

			return;
		},
	},
	text: {
		title: 'Домашняя работа',
		ContentComponent: ({ value, changeHandler }) => {
			return (
				<textarea
					autoFocus
					name="text"
					value={value}
					className={styles.text}
					onChange={(e) => {
						changeHandler(e.target.value);
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

const Placeholder: React.FC<{ width: number }> = ({ width }) => {
	return (
		<div className={styles.imagePlaceholder} style={{ width }}>
			<Loader height={300} />
		</div>
	);
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
