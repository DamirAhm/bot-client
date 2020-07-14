import styles from "../components/Content/Students/StudentPreview/StudentPreview.module.css";
import React from "react";
import { content } from "../types";
import { parseDate } from "./date";

export const highlightSearch = (str: string, searchString: string, highlightClass = styles.highlight) => {
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

export const parseContentByDate = <T extends content>(content: T[]): { [day: string]: T[] } => {
    const parsedCont: { [day: string]: T[] } = {};

    content.sort((a, b) => Date.parse(a.to) - Date.parse(b.to));

    for (let cont of content) {
        const contDate = parseDate(cont.to, "dd MM");
        if (parsedCont.hasOwnProperty(contDate)) {
                parsedCont[contDate].push(cont);
        } else {
            parsedCont[contDate] = [cont];
        }
    }

    return parsedCont;
}

export const objectForEach = <T extends {[key: string]: ValueType}, ValueType, Output>(object: T, fn: (value: ValueType) => Output): {[key: string]: Output} => {
    const entries: [keyof T, ValueType][] = Object.entries(object);
    const mappedEntries = entries.map(([key, value]) => [key, fn(value)]);

    return Object.fromEntries(mappedEntries);
}