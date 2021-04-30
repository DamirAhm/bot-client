import React from "react";
import { RoleNames } from "../components/Content/StudentPage/StudentInfo/StudentInfo";
import {
	attachment,
	callSchedule,
	content,
	lessonCalls,
	StudentInfoType,
	studentSettings,
	vkPhoto,
	WithTypename,
} from "../types";
import { parseDate, months } from "./date";

type c = content;

export const highlightSearch = (
	str: string,
	searchString: string,
	highlightClass = "highlight"
): JSX.Element => {
	if (searchString.trim() !== "") {
		const string = str.toLowerCase();
		searchString = searchString.toLowerCase();
		const ind = string.search(searchString);
		if (ind !== -1) {
			return (
				<span>
					{str.slice(0, ind)}
					<span className={highlightClass}>
						{str.slice(ind, ind + searchString.length)}
					</span>
					{str.slice(
						ind + searchString.length,
						str.length - ind + searchString.length
					)}
				</span>
			);
		} else if (
			searchString.split(" ").length > 1 &&
			searchString.split(" ").some(substr => string.search(substr) !== -1)
		) {
			return highlightSearch(
				string,
				searchString
					.split(" ")
					.find(substr => string.search(substr) !== -1) as string,
				highlightClass
			);
		}
	}
	return <span> {str} </span>;
};

const siteRegExp = /(https?:\/\/)?([\w-]{1,32}\.[\w-]{1,32})[^\s@]*/gi;
const fullSiteRegExp = /^(https?:\/\/)?([\w-]{1,32}\.[\w-]{1,32})[^\s@]*$/gi;
const emailRegExp = /(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))/gi;
const fullEmailRegExp = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/gi;
export const replaceHrefsByAnchors = (
	text: string,
	styles: { [key: string]: string }
): JSX.Element => {
	const siteMatch = text.match(siteRegExp);

	if (siteMatch) {
		const slices = text.split(new RegExp(siteMatch.join("|"))).filter(Boolean);

		for (let i = 0; i < siteMatch.length; i++) {
			slices.splice(i * 2 + 1, 0, siteMatch[i]);
		}

		for (let i = 0; i < slices.length - 1; i++) {
			if (slices[i].charAt(slices[i].length - 1) === "@") {
				slices[i] += slices[i + 1];
				slices.splice(i + 1, 1);
			}
		}

		let res: (string | JSX.Element)[] = [];

		for (const slice of slices) {
			if (slice.match(fullSiteRegExp)) {
				const element = (
					<React.Fragment key={slice}>
						{typeof res[res.length - 1] === "string" && <br />}
						<a href={slice} className={styles.hyperlink}>
							{slice}
						</a>
						<br />
					</React.Fragment>
				);

				res.push(element);
			} else {
				const emailMatch = slice.match(emailRegExp);

				if (emailMatch) {
					let emailSlices = slice
						.split(new RegExp(emailMatch.join("|")))
						.filter(str => Boolean(str.trim()));

					for (let i = 0; i < emailMatch.length; i++) {
						emailSlices.splice(i * 2 + 1, 0, emailMatch[i]);
					}
					if (emailSlices.length === 0) emailSlices = [emailMatch[0]];

					for (const emailSlice of emailSlices) {
						if (emailSlice.match(fullEmailRegExp)) {
							const element = (
								<React.Fragment key={emailSlice}>
									{typeof res[res.length - 1] === "string" && <br />}
									<a href={`mailto:${emailSlice}`} className={styles.hyperlink}>
										{emailSlice}
									</a>
									<br />
								</React.Fragment>
							);

							res.push(element);
						} else {
							res.push(emailSlice);
						}
					}
				} else {
					res.push(slice);
				}
			}
		}

		return <span className={styles.text}>{res}</span>;
	} else {
		return <span className={styles.text}>{text}</span>;
	}
};

export function separateContentByDate<T extends content>(content: T[]) {
	const futureContent: T[] = [];
	const pastContent: T[] = [];

	for (let cont of content) {
		if (
			Date.parse(cont.to) >= Date.now() ||
			isToday(new Date(Date.parse(cont.to)))
		) {
			futureContent.push(cont);
		} else {
			pastContent.push(cont);
		}
	}

	return { futureContent, pastContent };
}
export function parseContentByDate<T extends content>(content: T[]) {
	const parsedCont: { [day: string]: T[] } = {};

	for (let cont of content) {
		let contDate;

		if (isToday(new Date(cont.to))) {
			contDate = "Сегодня";
		} else if (isDateWithOffset(new Date(cont.to), 1)) {
			contDate = "Завтра";
		} else if (isDateWithOffset(new Date(cont.to), 2)) {
			contDate = "Послезавтра";
		} else {
			contDate = parseDate(cont.to, "d MM");
		}

		parsedCont[contDate] = [...(parsedCont[contDate] || []), cont];
	}

	return parsedCont;
}
export function getPinnedContent<T extends content>(content: T[]) {
	return content.filter(({ pinned }) => pinned);
}
export function objectForEach<
	T extends { [key: string]: ValueType },
	ValueType,
	Output
>(object: T, fn: (value: ValueType) => Output): { [key: string]: Output } {
	const entries: [keyof T, ValueType][] = Object.entries(object);
	const mappedEntries = entries.map(([key, value]) => [key, fn(value)]);

	return Object.fromEntries(mappedEntries);
}
export function concatObjects<T extends object>(objects: T[]) {
	return objects.reduce((acc, c) => Object.assign(acc, c), {});
}

export function getDateStrFromDayMonthStr(dayMonthStr: string): string {
	if (dayMonthStr.toLowerCase() === "завтра") {
		return new Date(new Date().setDate(new Date().getDate() + 1)).toISOString();
	} else if (dayMonthStr.toLowerCase() === "послезавтра") {
		return new Date(new Date().setDate(new Date().getDate() + 2)).toISOString();
	} else if (
		new RegExp(`\\d\\s(${Object.values(months).join("|")})`, "i").test(
			dayMonthStr
		)
	) {
		const [day, month] = dayMonthStr.split(" ");
		if (months.indexOf(month) !== -1 && !isNaN(Number(day))) {
			const monthIndex = months.indexOf(month);

			const date = new Date(new Date().getFullYear(), monthIndex, Number(day));

			return date.toISOString();
		}
	}
	return "";
}

export function isToday(date: Date) {
	const deltaIsLessThanDay =
		Math.abs(date.getTime() - new Date().getTime()) <= 24 * 60 * 60 * 1000;
	const datesAreSame = date.getDate() === new Date().getDate();
	return deltaIsLessThanDay && datesAreSame;
}
export function isDateWithOffset(date: Date, offset: number = 0) {
	const deltaIsLessThanDay =
		Math.abs(
			date.getTime() - new Date().setDate(new Date().getDate() + offset)
		) <=
		24 * 60 * 60 * 1000;
	const datesAreSame =
		date.getDate() ===
		new Date(new Date().setDate(new Date().getDate() + offset)).getDate();
	return deltaIsLessThanDay && datesAreSame;
}

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
	name: keyof StudentInfoType | keyof StudentInfoType["settings"]
): string {
	switch (name) {
		case "className": {
			if (typeof value === "string") {
				return value;
			}
			return "Нету";
		}
		case "lastHomeworkCheck": {
			if (typeof value === "string") {
				return parseDate(new Date(value), "dd MM YYYY hh:mm");
			}
			return "Нету";
		}
		case "role": {
			if (typeof value === "string") {
				return RoleNames[value] ?? value;
			}
			return "Нету";
		}
		case "schoolName": {
			if (typeof value === "string") {
				return String(parseSchoolName(value)?.[1] ?? "Нету");
			}
			return "Нету";
		}
	}

	if (typeof value === "boolean") return value ? "Да" : "Нет";
	else if (value instanceof Date)
		return value.toISOString() === "1970-01-01T00:00:00.000Z"
			? "Никогда"
			: parseDate(value.toISOString(), "YYYY.MMn.dd hh:mm");
	else if (Array.isArray(value)) return value.join(", ");

	if (value === undefined || value === null) return "Не указано";

	return typeof value === "string" ? value : JSON.stringify(value);
}
export function getPrettyName(name: string, shortenName: boolean = false) {
	if (!name) return "Error empty name";

	if (shortenName)
		return name.split(" ")[0][0].toUpperCase() + " " + name.split(" ")[1];
	else
		return (
			name.split(" ")[0] + " " + (name.split(" ")[1][0].toUpperCase() || "")
		);
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

const ruToEngTranslits: { [key: string]: string } = {
	а: "a",
	б: "b",
	в: "v",
	г: "g",
	д: "d",
	е: "e",
	ё: "yo",
	ж: "zh",
	з: "z",
	и: "i",
	й: "y",
	к: "k",
	л: "l",
	м: "m",
	н: "n",
	о: "o",
	п: "p",
	р: "r",
	с: "s",
	т: "t",
	у: "u",
	ф: "f",
	х: "h",
	ц: "c",
	ч: "ch",
	ш: "sh",
	щ: "shch",
	ъ: "^",
	ы: "i^",
	ь: "$",
	э: "e",
	ю: "yu",
	я: "ya",
	дж: "j",
};
const engToRuTranslits: { [key: string]: string } = {
	a: "а",
	b: "б",
	v: "в",
	g: "г",
	d: "д",
	e: "е",
	z: "з",
	i: "и",
	y: "й",
	k: "к",
	l: "л",
	m: "м",
	n: "н",
	o: "о",
	p: "п",
	r: "р",
	s: "с",
	t: "т",
	u: "у",
	f: "ф",
	h: "х",
	c: "ц",
	j: "дж",
	q: "к",
	x: "кс",
	yo: "ё",
	zh: "ж",
	"i^": "ы",
	ch: "ч",
	sh: "ш",
	shch: "щ",
	oo: "у",
	ee: "и",
	yu: "ю",
	ya: "я",
	$: "ь",
	"^": "ъ",
};
export function translit(rusWord: string): string {
	const specialCharacters = ["дж"];

	if (rusWord && typeof rusWord === "string") {
		if (new RegExp(specialCharacters.join("|"), "i").test(rusWord)) {
			for (const i of specialCharacters) {
				while (rusWord.indexOf(i) !== -1) {
					rusWord = rusWord.replace(i, ruToEngTranslits[i]);
				}
			}
		}
		for (const i of Object.keys(ruToEngTranslits)) {
			while (rusWord.indexOf(i) !== -1) {
				rusWord = rusWord.replace(i, ruToEngTranslits[i]);
			}
		}

		return rusWord;
	} else {
		return "";
	}
}
export function retranslit(engWord: string) {
	const specialCharacters = [
		"shch",
		"ch",
		"sh",
		"zh",
		"yo",
		"yu",
		"ya",
		"oo",
		"ee",
		"i^",
	];

	if (engWord && typeof engWord === "string") {
		if (new RegExp(specialCharacters.join("|"), "i").test(engWord)) {
			for (const i of specialCharacters) {
				while (engWord.indexOf(i) !== -1) {
					engWord = engWord.replace(i, engToRuTranslits[i]);
				}
			}
		}
		for (const i of Object.keys(engToRuTranslits)) {
			while (engWord.indexOf(i) !== -1) {
				engWord = engWord.replace(i, engToRuTranslits[i]);
			}
		}

		return engWord;
	} else {
		return "";
	}
}
export function capitalize(word: string) {
	return word[0].toUpperCase() + word.slice(1);
}

export function parseAttachment(photo: vkPhoto) {
	return `photo${photo.owner_id}_${photo.id}`;
}
export function findMaxPhotoResolution(photo: vkPhoto) {
	return photo.sizes.reduce<{ url: string; height: number }>(
		(acc, c) => (c.height > acc.height ? c : acc),
		{ height: 0, url: "" }
	).url;
}
export function getPhotoUploadURL() {
	if (document.location.hostname === "localhost") {
		return "http://localhost:8080/saveAttachment";
	} else if (document.location.origin.endsWith("/")) {
		return document.location.origin + `saveAttachment`;
	} else {
		return document.location.origin + `/saveAttachment`;
	}
}
export async function uploadPhoto(files: any) {
	try {
		if (files) {
			const fd = new FormData();
			for (let i = 0; i < files.length; i++) {
				fd.append("newAttachment", files[i]);
			}

			const { photos }: { photos: vkPhoto[] } = await fetch(
				getPhotoUploadURL(),
				{
					method: "POST",
					body: fd,
					headers: {
						accepts: "application/json",
					},
				}
			).then(res => res.json());

			const newAttachments: WithTypename<attachment>[] = photos.map(
				(photo, i) => ({
					url: findMaxPhotoResolution(photo),
					value: parseAttachment(photo),
					_id: i + Date.now().toString(),
					__typename: "ClassHomeworkAttachment",
				})
			);

			return newAttachments;
		} else {
			return null;
		}
	} catch (e) {
		console.error(e);
		return null;
	}
}

export function findContentById<
	T extends content,
	ContentMap extends Record<string, T[]>
>(content: ContentMap, id: string): T | null {
	const contentArray: T[] = Object.values(content).flat();

	return contentArray.find(content => content._id === id) || null;
}

export function inRange(number: number, min: number, max: number) {
	if (min === undefined && min > number) {
		return false;
	}

	if (max === undefined && max < number) {
		return false;
	}

	return true;
}

export function getCallCheduleForDay(
	callSchedule: callSchedule,
	dayIndex: number
) {
	if (inRange(dayIndex, 1, 7)) {
		const { exceptions, defaultSchedule } = callSchedule;
		if (exceptions[dayIndex - 1].length > 0 && dayIndex !== 7) {
			return exceptions[dayIndex - 1];
		} else {
			return defaultSchedule;
		}
	} else {
		throw new Error("Day index must be in range 1 to 7, got: " + dayIndex);
	}
}

export const timeRegExp = /([0-9]{1,2}):([0-9]{2})/;
export function checkValidTime(str: string) {
	if (timeRegExp.test(str)) {
		//@ts-ignore
		const [hours, minutes] = str
			.match(timeRegExp)
			.slice(1)
			.map(n => parseInt(n));
		if (
			!isNaN(hours) &&
			!isNaN(minutes) &&
			inRange(hours, 0, 23) &&
			inRange(minutes, 0, 59)
		) {
			return true;
		}
	}

	return false;
}
export function compareTimes(a: string, b: string) {
	if (checkValidTime(a) && checkValidTime(b)) {
		return a > b;
	} else {
		throw new Error("Times should be in format 00:00, got: " + `${a} and ${b}`);
	}
}
export function getTimeFromDate(date: Date) {
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	return `${hours}:${minutes}`;
}
export function getLessonAtSpecificTime(
	callSchedule: lessonCalls[],
	date: Date
) {
	const lessonEnds = callSchedule.map(({ end }) => end);
	const time = getTimeFromDate(date);

	let index = 0;

	while (compareTimes(time, lessonEnds[index]) && index < lessonEnds.length - 1)
		index++;

	return index;
}
