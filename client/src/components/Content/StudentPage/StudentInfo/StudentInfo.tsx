import React, { useContext } from 'react';
import styles from './StudentInfo.module.css';
import { changeHandler } from './Changer';
import Changer from './Changer';
import { roles, StudentInfoType } from '../../../../types';
import { convertStudentInfoValue } from '../../../../utils/functions';
import { UserContext } from '../../../../App';

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
	studentCanChange: string[];
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
	schoolName: 'Школа',
};

const StudentInfo: React.FC<Props> = ({
	name,
	value,
	changeHandler,
	isChanging,
	studentCanChange = [],
}) => {
	const { role } = useContext(UserContext);

	if (!['__typename', null, '_id'].includes(name)) {
		const text = convertStudentInfoValue(value, name);

		return (
			<div className={styles.info}>
				{!isChanging ||
				name === 'vkId' ||
				name === 'schoolName' ||
				(role !== roles.admin && !studentCanChange.includes(name)) ? (
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
											changeHandler={(pole, value) =>
												changeHandler(`${name}.${pole}`, value)
											}
											studentCanChange={studentCanChange}
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
					<>
						{typeof value === 'object' &&
						value !== null &&
						!Array.isArray(value) &&
						!(value instanceof Date) ? (
							<div className={`${styles.changer}`}>
								{infos[name] || name}:
								<div className={styles.nested}>
									{Object.entries(value).map((entrie) => (
										<StudentInfo
											studentCanChange={studentCanChange}
											isChanging={true}
											name={
												entrie[0] as
													| keyof StudentInfoType
													| keyof StudentInfoType['settings']
											}
											value={entrie[1]}
											key={name + entrie[0]}
											changeHandler={(pole, value) =>
												changeHandler(`${name}.${pole}`, value)
											}
										/>
									))}
								</div>
							</div>
						) : (
							<Changer
								changeHandler={changeHandler}
								name={name}
								value={value ?? 'Нету'}
							/>
						)}
					</>
				)}
			</div>
		);
	} else if (name && value === null) {
		return (
			<div className={styles.info}>
				{!isChanging ? (
					<div className={`${styles.showing}`}>
						<div className={styles.value}>
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
