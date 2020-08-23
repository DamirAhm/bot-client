import React, { memo } from "react";
import styles from "./StudentPreview.module.css";
import { highlightSearch } from "../../../../utils/functions";
import { Link } from "react-router-dom";
import { studentPreview } from "../Students";

type Props = {
    searchText?: string
} & studentPreview

const StudentPreview: React.FC<Props> = ({ vkId, role, className, searchText, fullName: name }) => {
    const highlighter = (str: string) => {
        return highlightSearch(str, searchText || "");
    };

    return (
        <div className={`${styles.preview}`}>
            <Link to={`/students/${vkId}`} className={`${styles.link}`}>
                <span className={styles.info}> {highlighter(getPrettyName(name))} </span>
                <span className={styles.info}> {highlighter(getPrettyName(role))} </span>
                <span className={styles.info}> {highlighter(getPrettyName(className))} </span>
            </Link>
        </div>
    )
};

export default memo(StudentPreview);

function getPrettyName(name: string): string {
    if (!name) return "Error empty name"
    return name.split(" ")[0] + " " + (name.split(" ")[1]?.[0]?.toUpperCase() || "");
}
