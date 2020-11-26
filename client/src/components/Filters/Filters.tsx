import React, { HTMLAttributes, useState } from 'react';
import styles from './Filters.module.css';
import { sort } from '../Content/Students/Students';
import Searcher from '../Common/Searcher/Searcher';
import Select, { StylesConfig, ValueType } from 'react-select';
import { isOptionType, optionType } from '../../types';

interface Props extends HTMLAttributes<HTMLDivElement> {
	sortsList?: sort[];
	setSort?: (fn: string) => void;
	searchText?: string;
	setSearchText?: (str: string) => void;
	defaultSort?: string;
	inputProps?: HTMLAttributes<HTMLDivElement>;
	sortProps?: HTMLAttributes<HTMLDivElement>;
}

const selectStyles: StylesConfig = {
	container: (provided) => ({
		...provided,
		width: '100%',
		fontSize: '1.6rem',
	}),
};

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

	const sortOptions: optionType[] | undefined = sortsList?.map(({ name }) => ({
		label: name,
		value: name,
	}));

	const onChangeSort = (value: ValueType<optionType>) => {
		if (isOptionType(value) && setSort) {
			setSort(value.label);
		}
	};

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
				{sortsList?.length && sortOptions && setSort && (
					<div className={styles.sorts} {...sortProps}>
						<Select
							options={sortOptions}
							defaultValue={sortOptions.find(({ value }) => value === defaultSort)}
							onChange={onChangeSort}
							styles={selectStyles}
							placeholder={'Выбрать'}
						/>
					</div>
				)}
			</div>
		</div>
	);
};

export default Filters;
