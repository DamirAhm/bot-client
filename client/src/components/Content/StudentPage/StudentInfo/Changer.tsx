import React from 'react';
import styles from './StudentInfo.module.css';
import StudentInfo, { infos } from './StudentInfo';
import { gql } from 'apollo-boost';
import { useQuery } from '@apollo/react-hooks';
import { StudentInfoType } from '../../../../types';

export type changeHandler<T = string | number | boolean> = (path: string, value: T) => void;
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

const Changer: React.FC<Props<string | number | boolean | object | null>> = ({
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
					{name === 'className' || name === 'role' || name === 'notificationTime' ? (
						<>
							{name === 'className' && (
								<div className={styles.changer}>
									{infos[name] || name}:{' '}
									<Selector
										changeHandler={(change) => changeHandler(name, change)}
										defaultValue={value}
										options={data?.classes
											.map((obj) => obj.name)
											.concat(['Нету'])}
									/>
								</div>
							)}
							{name === 'role' && (
								<div className={styles.changer}>
									{infos[name] || name}:{' '}
									<Selector
										changeHandler={(change) => changeHandler(name, change)}
										defaultValue={value}
										options={data?.roles}
									/>
								</div>
							)}
							{name === 'notificationTime' && (
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
			{typeof value === 'object' && value !== null && (
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
								changeHandler={(pole: string, value: number | boolean | string) =>
									changeHandler(`${name}.${pole}`, value)
								}
							/>
						))}
					</div>
				</div>
			)}
		</div>
	);
};
export default Changer;
