import React, {useState} from "react";
import styles from "./ClassPreview.module.css";
import {FaRegCheckCircle, FaRegTimesCircle} from "react-icons/fa";
import {gql} from "apollo-boost";
import {useApolloClient, useMutation} from "@apollo/react-hooks";
import {GET_CLASSES} from "../Classes";

const CREATE_CLASS = gql`
    mutation CreateClass($name: String!) {
        classCreateOne(record: {name: $name}) {
            record {
                name
                studentsCount
            }
        }
    }
`;

const ClassCreator: React.FC = () => {
    const [creating, setCreating] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const client = useApolloClient();

    const [createClass, {error, data}] = useMutation<{ classCreateOne: { record: { name: string, studentsCount: number } } },
        { name: string }>(CREATE_CLASS, {
        variables: {
            name
        },
        onCompleted: data => {
            client.writeQuery({
                query: GET_CLASSES,
                data: {
                    classes: client.readQuery({query: GET_CLASSES}).classes.concat([data.classCreateOne.record]) || []
                }
            })
        }
    });

    const clear = () => {
        setCreating(false);
    };
    const confirm = () => {
        createClass();
        setCreating(false);
        setName("");
    };

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.creator} ${styles.preview}`}>
                {creating ?
                    <form onSubmit={confirm} className={styles.form}>
                        <FaRegTimesCircle size={20} className={styles.reject} onClick={clear}/>
                        <input onChange={(e) => setName(e.target.value)} value={name} autoFocus={true} type="text"
                               className={styles.input}/>
                        <FaRegCheckCircle onClick={confirm} className={styles.confirm} size={20}/>
                    </form> :
                    <div onClick={() => setCreating(true)}>Create class</div>
                }
            </div>
        </div>
    )
}

export default ClassCreator;