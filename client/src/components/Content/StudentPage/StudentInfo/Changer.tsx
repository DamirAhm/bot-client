import React from 'react';
import styles from './StudentInfo.module.css';
import StudentInfo, { infos } from './StudentInfo';
import { gql } from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';
import { StudentInfoType } from '../../../../types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

export type changeHandler<T = string | number | boolean | string[] | number[]> = (
	path: string,
	value: T,
) => void;
type SelectorProps = {
	options?: string[];
	defaultValue: string;
	changeHandler: (value: string) => void;
};
const Selector: React.FC<SelectorProps> = ({
	changeHandler,
	defaultValue,
	options = ['     '],
}) => {
	return (
		<select onChange={(e) => changeHandler(e.target.value)}>
			<option key={defaultValue} value={defaultValue}>
				{defaultValue}
			</option>
			{options.map(
				(option) =>
					option !== defaultValue && (
						<option key={option} value={option}>
							{option}
						</option>
					),
			)}
		</select>
	);
};

type Props<T> = {
	value: T;
	name: string;
	changeHandler: changeHandler;
};

const GET_INFO = gql`
	{
		classes: classMany {
			name
		}
		roles: getRoles
	}
`;

const Changers: {
	[key: string]: React.ComponentType<{
		value: any;
		name: string;
		changeHandler: changeHandler;
		[props: string]: any;
	}>;
} = {
	className: ({ value, name, options, changeHandler }) => {
		return (
			<div className={styles.changer}>
				{infos[name] || name}:
				<Selector
					changeHandler={(change) => changeHandler(name, change)}
					defaultValue={value}
					options={options}
				/>
			</div>
		);
	},
	role: ({ value, name, changeHandler, roles }) => {
		return (
			<div className={styles.changer}>
				{infos[name] || name}:
				<Selector
					changeHandler={(change) => changeHandler(name, change)}
					defaultValue={value}
					options={roles}
				/>
			</div>
		);
	},
	notificationTime: ({ value, name, changeHandler }) => {
		return (
			<div className={styles.changer}>
				{infos[name] || name}:
				<input
					type="text"
					className={`${styles.changeString}`}
					defaultValue={value}
					onChange={(e) => changeHandler(name, e.target.value)}
				/>
			</div>
		);
	},
	lastHomeworkCheck: ({ value, name, changeHandler }) => {
		return (
			<div className={styles.changer}>
				{infos[name] || name}:
				<DatePicker
					selected={new Date(value)}
					onChange={(date: Date) => {
						changeHandler(name, date.toISOString());
					}}
					showTimeInput
					dateFormat={'dd/MM/yyyy hh:mm'}
					className={styles.datePickerInput}
					showPopperArrow={false}
					calendarClassName={styles.datePickerCalendar}
					maxDate={new Date()}
				/>
			</div>
		);
	},
};

const numberSequenceRegExp = /([0-9]*,\s*)*[0-9]+/;
const Changer: React.FC<Props<string | number | boolean | object | Date | null>> = ({
	name,
	value,
	changeHandler,
}) => {
	const { data, error } = useQuery<{ classes: { name: string }[]; roles: string[] }>(GET_INFO);

	if (error) return <div>{error}</div>;

	return (
		<div className={`${styles.changing}`}>
			{typeof value == 'string' && (
				<>
					{name === 'className' ||
					name === 'role' ||
					name === 'notificationTime' ||
					name === 'lastHomeworkCheck' ? (
						<>
							{name === 'className' && (
								<Changers.className
									name={name}
									value={value}
									changeHandler={changeHandler}
									options={data?.classes.map((obj) => obj.name).concat(['Нету'])}
								/>
							)}
							{name === 'role' && (
								<Changers.role
									name={name}
									value={value}
									changeHandler={changeHandler}
									roles={data?.roles}
								/>
							)}
							{name === 'notificationTime' && (
								<Changers.notificationTime
									value={value}
									name={name}
									changeHandler={changeHandler}
								/>
							)}
							{name === 'lastHomeworkCheck' && (
								<Changers.lastHomeworkCheck
									name={name}
									value={value}
									changeHandler={changeHandler}
								/>
							)}
						</>
					) : (
						<div className={styles.changer}>
							{infos[name] || name}:{' '}
							<input
								type="text"
								className={`${styles.changeString}`}
								defaultValue={value}
								onChange={(e) => changeHandler(name, e.target.value)}
							/>
						</div>
					)}
				</>
			)}
			{typeof value === 'number' && (
				<div className={styles.changer}>
					{infos[name] || name}:{' '}
					<input
						type="number"
						className={`${styles.changeNumber}`}
						defaultValue={value}
						onChange={(e) => changeHandler(name, +e.target.value)}
					/>
				</div>
			)}
			{typeof value === 'boolean' && (
				<div className={styles.changer}>
					{infos[name] || name}:{' '}
					<input
						type="checkbox"
						className={`${styles.changeBool}`}
						defaultChecked={value}
						onChange={(e) => changeHandler(name, e.target.checked)}
					/>
				</div>
			)}
			{typeof value === 'object' && value !== null && !Array.isArray(value) && (
				<div className={`${styles.changer}`}>
					{infos[name] || name}:
					<div className={styles.nested}>
						{Object.entries(value).map((entrie) => (
							<StudentInfo
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
			)}
			{Array.isArray(value) && (
				<div className={styles.changer}>
					{infos[name] || name}:{' '}
					<input
						type="text"
						className={`${styles.changeString}`}
						defaultValue={value.join(', ')}
						onChange={({ target: { value: string } }) => {
							if (
								typeof value[0] === 'number' ||
								name === 'settings.daysForNotification'
							) {
								if (
									numberSequenceRegExp.test(string) &&
									string.match(numberSequenceRegExp)?.[0] === string &&
									string.split(',').every((e) => !isNaN(+e))
								) {
									changeHandler(name, string.split(',').map(Number));
								}
							} else if (typeof value[0] === 'string') {
								if (
									/([a-zа-я]*,)*[а-яa-z]+/i.test(string) &&
									string.match(/([a-zа-я]*,)*[а-яa-z]+/i)?.[0] === string
								) {
									changeHandler(name, string.split(','));
								}
							} else {
								throw new Error('Arrays must contain only strings or numbers');
							}
						}}
					/>
				</div>
			)}
		</div>
	);
};
export default Changer;
