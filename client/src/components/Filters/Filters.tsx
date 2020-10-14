import React, { HTMLAttributes, useState } from 'react';
import styles from './Filters.module.css';
import { sort } from '../Content/Students/Students';
import Searcher from '../Common/Searcher/Searcher';

interface Props extends HTMLAttributes<HTMLDivElement> {
	sortsList?: sort[];
	setSort?: (fn: string) => void;
	searchText?: string;
	setSearchText?: (str: string) => void;
	defaultSort?: string;
	inputProps?: HTMLAttributes<HTMLDivElement>;
	sortProps?: HTMLAttributes<HTMLDivElement>;
}

const Filters: React.FC<Props> = ({
	sortsList,
	setSearchText,
	setSort,
	defaultSort,
	inputProps,
	sortProps,
	...props
}) => {
	const [text, setText] = useState('');

	return (
		<div {...props} className={props.className || styles.filterContainer}>
			<div className={styles.filters}>
				{setSearchText && (
					<div className={styles.search} {...inputProps}>
						<Searcher
							onChange={(text: string) => {
								setText(text);
								setSearchText(text);
							}}
							placeholder={'Поиск'}
							value={text}
						/>
					</div>
				)}
				{sortsList?.length && setSort && (
					<div className={styles.sorts} {...sortProps}>
						<select
							onChange={(e) => setSort(e.target.value)}
							name="sorts"
							id="sorts"
							defaultValue={defaultSort}
						>
							{!defaultSort && (
								<option key="none" value="none">
									{' '}
									Сортировать по{' '}
								</option>
							)}
							{sortsList.map(({ name }) => (
								<option key={name} value={name}>
									{name}
								</option>
							))}
						</select>
					</div>
				)}
			</div>
		</div>
	);
};

export default Filters;
