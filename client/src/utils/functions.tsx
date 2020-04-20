import styles from "../components/Content/Students/StudentPreview/StudentPreview.module.css";
import React from "react";

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