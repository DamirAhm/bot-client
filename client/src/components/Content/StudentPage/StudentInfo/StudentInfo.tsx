import React from 'react';
import styles from './StudentInfo.module.css';
import { changeHandler } from './Changer';
import Changer from './Changer';
import { parseDate } from '../../../../utils/date';
import { roles, StudentInfoType } from '../../../../types';

export const RoleNames: { [key: string]: string } = {
	[roles.admin]: 'Админ',
	[roles.contributor]: 'Редактор',
	[roles.student]: 'Ученик',
};

type Props = {
	name: keyof StudentInfoType | keyof StudentInfoType['settings'];
	value: number | string | object | boolean | Date | null;
	changeHandler: changeHandler;
	isChanging: boolean;
};

export const infos: { [key: string]: string } = {
	vkId: 'ВК id',
	role: 'Роль',
	settings: 'Настройки',
	notificationsEnabled: 'Уведомления включены',
	notificationTime: 'Время напоминания',
	daysForNotification: 'Напоминать за',
	lastHomeworkCheck: 'Последняя проверка дз',
	className: 'Класс',
};

const convertValue = (
	value: string | boolean | object | Date | number | null,
	name: keyof StudentInfoType | keyof StudentInfoType['settings'],
) => {
	switch (name) {
		case 'className': {
			return value ?? 'Нету';
		}
		case 'lastHomeworkCheck': {
			if (typeof value === 'string') {
				return parseDate(new Date(value), 'dd MM YYYY hh:mm');
			}
		}
		case 'role': {
			if (typeof value === 'string') {
				return RoleNames[value] ?? value;
			}
		}
	}

	if (typeof value === 'boolean') return value ? 'Да' : 'Нет';
	else if (value instanceof Date)
		return value.toISOString() === '1970-01-01T00:00:00.000Z'
			? 'Никогда'
			: parseDate(value.toISOString(), 'YYYY.MMn.dd hh:mm');
	else if (Array.isArray(value)) return value.join(', ');

	if (value === undefined || value === null) return 'Не указано';

	return value;
};

const StudentInfo: React.FC<Props> = ({ name, value, changeHandler, isChanging }) => {
	if (!['__typename', null, '_id'].includes(name)) {
		const text = convertValue(value, name);

		return (
			<div className={styles.info}>
				{!isChanging || name === 'vkId' ? (
					<div className={`${styles.showing}`}>
						{typeof value == 'object' &&
						value !== null &&
						!(value instanceof Date) &&
						!Array.isArray(value) ? (
							<div className={styles.value}>
								{infos[name] || name}:
								<div className={styles.nested}>
									{Object.entries(value).map((entrie) => (
										<StudentInfo
											isChanging={isChanging}
											name={
												entrie[0] as
													| keyof StudentInfoType
													| keyof StudentInfoType['settings']
											}
											value={entrie[1]}
											key={name + entrie[0]}
											changeHandler={(
												pole: string,
												value: number | boolean | string,
											) => changeHandler(`${name}.${pole}`, value)}
										/>
									))}
								</div>
							</div>
						) : (
							<div className={styles.value}>
								{infos[name] || name}: {text}
							</div>
						)}
					</div>
				) : (
					<Changer changeHandler={changeHandler} name={name} value={value ?? 'Нету'} />
				)}
			</div>
		);
	} else if (name && value === null) {
		return (
			<div className={styles.info}>
				{!isChanging ? (
					<div className={`${styles.showing}`}>
						<div className={styles.value}>
							{' '}
							{infos[name] || name}: {'Не указано'}
						</div>
					</div>
				) : (
					<Changer changeHandler={changeHandler} name={name} value={value ?? 'Нету'} />
				)}
			</div>
		);
	}
	return <></>;
};

export default StudentInfo;
