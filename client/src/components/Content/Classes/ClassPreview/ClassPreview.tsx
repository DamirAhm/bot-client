import React, { memo } from "react";
import styles from "./ClassPreview.module.css";
import { gql } from "apollo-boost";
import { useMutation } from "@apollo/react-hooks";
import { highlightSearch } from "../../../../utils/functions";
import { Link } from "react-router-dom";
import { redactorOptions } from "../../../../types";
import Options from "../../../Common/Options";

type Props = {
    className: string,
    studentsCount: number,
    searchText: string
}

// language=GraphQL
const DELETE_CLASS = gql`
    mutation RemoveOne($className: String!){
        classRemoveOne(className: $className) {
            name
            __typename
        }
        deleteClass(name: $className) @client
    }
`;
//TODO добавить модалку спрашивающую уверен ли ты в удалении класса
const ClassPreview: React.FC<Props> = ({ className, studentsCount, searchText }) => {
    const [deleteClass, { error, data }] = useMutation<{ classRemoveOne: { record: { name: string } } },
        { className: string }>
        (DELETE_CLASS, {
            variables: { className }
        }
        );

    const highlighter = (str: string) => {
        return highlightSearch(str, searchText);
    };

    if (error) console.error(error);
    if (data) {
        return (
            <div className={styles.preview} style={{ backgroundColor: "var(--secondary)" }}>
                <div className={styles.firstRow} />
                <div className={styles.secondRow} />
            </div>
        )
    }
    return (
        <div className={styles.preview}>
            <Link to={`/classes/${className}`} className={styles.link}>
                <p className={styles.name}> {highlighter(className)} </p>
                <div className={styles.count}> Учеников: {highlighter(String(studentsCount))} </div>
                <div></div>
            </Link>
            <Options 
                include={redactorOptions.delete}
                props={{
                    onClick: () => deleteClass(),
                    size: 20,
                    className: "remove"
                }}
            />
        </div>
    )
};

export default memo(ClassPreview);