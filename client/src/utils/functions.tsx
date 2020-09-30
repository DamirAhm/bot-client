import React from 'react';
import { RoleNames } from '../components/Content/StudentPage/StudentInfo/StudentInfo';
import { content, StudentInfoType } from '../types';
import { parseDate, months } from './date';

type c = content;

export const highlightSearch = (
	str: string,
	searchString: string,
	highlightClass = 'highlight',
) => {
	if (searchString.trim() !== '') {
		const string = str.toLowerCase();
		searchString = searchString.toLowerCase();
		const ind = string.search(searchString);
		if (ind !== -1) {
			return (
				<span>
					{' '}
					{str.slice(0, ind)}{' '}
					<span className={highlightClass}>
						{' '}
						{str.slice(ind, ind + searchString.length)}{' '}
					</span>{' '}
					{str.slice(ind + searchString.length, str.length - ind + searchString.length)}{' '}
				</span>
			);
		}
	}
	return <span> {str} </span>;
};

export const parseContentByDate = <T extends c>(
	content: T[],
): [{ [day: string]: T[] }, { [day: string]: T[] }] => {
	const parsedFutureCont: { [day: string]: T[] } = {};
	const parsedPastCont: { [day: string]: T[] } = {};

	content.sort((a, b) => Date.parse(a.to) - Date.parse(b.to));

	for (let cont of content) {
		const contDate = parseDate(cont.to, 'd MM');

		if (Date.parse(cont.to) >= Date.now() || isToday(new Date(Date.parse(cont.to)))) {
			parsedFutureCont[contDate] = [...(parsedFutureCont[contDate] || []), cont];
		} else {
			parsedPastCont[contDate] = [...(parsedPastCont[contDate] || []), cont];
		}
	}

	return [parsedPastCont, parsedFutureCont];
};

export const objectForEach = <T extends { [key: string]: ValueType }, ValueType, Output>(
	object: T,
	fn: (value: ValueType) => Output,
): { [key: string]: Output } => {
	const entries: [keyof T, ValueType][] = Object.entries(object);
	const mappedEntries = entries.map(([key, value]) => [key, fn(value)]);

	return Object.fromEntries(mappedEntries);
};

export const getDateStrFromDayMonthStr = (dayMonthStr: string): string => {
	if (new RegExp(`\\d\\s(${Object.values(months).join('|')})`, 'i').test(dayMonthStr)) {
		const [day, month] = dayMonthStr.split(' ');
		if (months.indexOf(month) !== -1 && !isNaN(Number(day))) {
			const monthIndex = months.indexOf(month);

			const date = new Date(new Date().getFullYear(), monthIndex, Number(day));

			return date.toISOString();
		}
	}
	return '';
};

export function isToday(date: Date) {
	const deltaIsLessThanDay =
		Math.abs(date.getTime() - new Date().getTime()) <= 24 * 60 * 60 * 1000;
	const datesAreSame = date.getDate() === new Date().getDate();
	return deltaIsLessThanDay && datesAreSame;
}

type convertSettings = {
	shortenName?: boolean;
};

export function parseSchoolName(schoolName: string): [string, number] | null {
	const match = schoolName.match(/^([a-z]+):(\d+)/);
	if (match !== null) {
		const [_, city, number] = match;

		if (!isNaN(+number)) {
			return [city, +number];
		} else {
			return null;
		}
	}
	return null;
}

export function convertStudentInfoValue(
	value: string | boolean | object | Date | number | null | undefined,
	name: keyof StudentInfoType | keyof StudentInfoType['settings'],
): string {
	switch (name) {
		case 'className': {
			if (typeof value === 'string') {
				return value;
			}
			return 'Нету';
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
		case 'schoolName': {
			if (typeof value === 'string') {
				return String(parseSchoolName(value)?.[1] ?? 'Нету');
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

	return typeof value === 'string' ? value : JSON.stringify(value);
}
export function getPrettyName(name: string, shortenName: boolean = false) {
	if (!name) return 'Error empty name';

	if (shortenName) return name.split(' ')[0][0].toUpperCase() + ' ' + name.split(' ')[1];
	else return name.split(' ')[0] + ' ' + (name.split(' ')[1][0].toUpperCase() || '');
}

export function memoize(fn: (...props: any) => any) {
	const cache = new Map();

	return (...props: any) => {
		const propsString = JSON.stringify(props);
		if (cache.has(propsString)) return cache.get(propsString);

		const res = fn(...props);

		cache.set(propsString, res);

		return res;
	};
}

export function changeTitle(newTitle: string): void {
	document.title = newTitle;
}
