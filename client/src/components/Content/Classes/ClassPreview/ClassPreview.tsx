import React, {memo} from "react";
import styles from "./ClassPreview.module.css";
import {IoIosTrash} from "react-icons/io";
import {gql} from "apollo-boost";
import {useMutation} from "@apollo/react-hooks";

type Props = {
    className: string,
    studentsCount: number
}

// language=GraphQL
const DELETE_CLASS = gql`
    mutation RemoveOne($className: String!){
        classRemoveOne(filter: {name: $className}) {
            recordId
        }
        deleteClass(name: $className) @client
    }
`;
//TODO добавить модалку спрашивающую уверен ли ты в удалении класса
const ClassPreview: React.FC<Props> = ({className, studentsCount}) => {
    const [deleteClass, {error, data}] = useMutation<{ classRemoveOne: { record: { name: string } } },
        { className: string }>
    (DELETE_CLASS, {
            variables: {className}
        }
    );

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
                <p className={styles.name}> {className} </p>
                <IoIosTrash onClick={() => deleteClass()} size={20} className={styles.remove}/>
            </div>
            <div className={styles.secondRow}>
                <div className={styles.count}> Учеников: {studentsCount} </div>
            </div>
        </div>
    )
};

export default memo(ClassPreview);