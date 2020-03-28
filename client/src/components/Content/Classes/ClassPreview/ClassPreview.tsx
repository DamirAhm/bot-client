import React, {memo} from "react";
import styles from "./ClassPreview.module.css";
import {IoIosTrash} from "react-icons/io";
import {gql} from "apollo-boost";
import {useMutation} from "@apollo/react-hooks";
import {highlightSearch} from "../../../../utils/functions";

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
const ClassPreview: React.FC<Props> = ({className, studentsCount, searchText}) => {
    const [deleteClass, {error, data}] = useMutation<{ classRemoveOne: { record: { name: string } } },
        { className: string }>
    (DELETE_CLASS, {
            variables: {className}
        }
    );

    const highlighter = (str: string) => {
      return highlightSearch(str, searchText);
    };

    if (error) console.error(error);
    if (data) {
        return (
            <div className={styles.preview} style={{backgroundColor: "var(--secondary)"}}>
                <div className={styles.firstRow}/>
                <div className={styles.secondRow}/>
            </div>
        )
    }
    return (
        <div className={styles.preview}>
            <div className={styles.firstRow}>
                <p className={styles.name}> {highlighter(className)} </p>
                <IoIosTrash onClick={() => deleteClass()} size={20} className={styles.remove}/>
            </div>
            <div className={styles.secondRow}>
                <div className={styles.count}> Учеников: {highlighter(String(studentsCount))} </div>
            </div>
        </div>
    )
};

export default memo(ClassPreview);