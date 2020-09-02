import React from "react";
import { content } from "../types";
import { parseDate, months } from "./date";

type c = content;

export const highlightSearch = (str: string, searchString: string, highlightClass = "highlight") => {
    if (searchString.trim() !== "") {
        const string = str.toLowerCase();
        searchString = searchString.toLowerCase();
        const ind = string.search(searchString);
        if (ind !== -1) {
            return <span> {str.slice(0, ind)} <span className={highlightClass}> {str.slice(ind, ind + searchString.length)} </span> {str.slice(ind + searchString.length, str.length - ind + searchString.length)} </span>
        }
    }
    return <span> {str} </span>
};

export const parseContentByDate = <T extends c>(content: T[]): [{ [day: string]: T[] }, { [day: string]: T[] }] => {
    const parsedFutureCont: { [day: string]: T[] } = {};
    const parsedPastCont: { [day: string]: T[] } = {};

    content.sort((a, b) => Date.parse(a.to) - Date.parse(b.to));

    for (let cont of content) {
        const contDate = parseDate(cont.to, "dd MM");

        if (Date.parse(cont.to) >= Date.now() || isToday(new Date(Date.parse(cont.to)))) {
            parsedFutureCont[contDate] = [...(parsedFutureCont[contDate] || []), cont];
        } else {
            parsedPastCont[contDate] = [...(parsedPastCont[contDate] || []), cont];
        }
    }

    return [parsedPastCont, parsedFutureCont];
}

export const objectForEach = <T extends { [key: string]: ValueType }, ValueType, Output>(object: T, fn: (value: ValueType) => Output): { [key: string]: Output } => {
    const entries: [keyof T, ValueType][] = Object.entries(object);
    const mappedEntries = entries.map(([key, value]) => [key, fn(value)]);

    return Object.fromEntries(mappedEntries);
}

export const getDateStrFromDayMonthStr = (dayMonthStr: string): string => {
    if (new RegExp(`\\d\\s(${Object.values(months).join("|")})`, "i").test(dayMonthStr)) {
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

export function memoize(fn: (...props: any) => any) {
    const cache = new Map();

    return (...props: any) => {
        const propsString = JSON.stringify(props);
        if (cache.has(propsString)) return cache.get(propsString)

        const res = fn(...props);

        cache.set(propsString, res);

        return res;
    }
}