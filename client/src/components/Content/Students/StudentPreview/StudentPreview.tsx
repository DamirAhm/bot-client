import React, { memo } from "react";
import styles from "./StudentPreview.module.css";
import { highlightSearch } from "../../../../utils/functions";
import { Link } from "react-router-dom";
import { studentPreview } from "../Students";

type Props = {
    searchText?: string
    visibleInfo?: (keyof studentPreview)[]
} & studentPreview

const StudentPreview: React.FC<Props> = ({ searchText, visibleInfo = ["fullName", "role", "className"], children, ...info }) => {
    const highlighter = (str: string) => {
        return highlightSearch(str, searchText || "");
    };

    return (
        <div className={`${styles.preview}`}>
            <Link to={`/students/${info.vkId}`} className={`${styles.link}`}>
                {visibleInfo.map((key) =>
                    <span
                        key={key}
                        className={styles.info}> {highlighter((key === "fullName" ? getPrettyName(info.fullName) : info[key]) as string)} </span>
                )}
            </Link>
        </div>
    )
};

export default memo(StudentPreview);

function getPrettyName(name: string) {
    if (!name) return "Error empty name"
    return name.split(" ")[0] + " " + (name.split(" ")[1]?.[0]?.toUpperCase() || "");
}
