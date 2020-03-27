import React, {useState} from "react";
import styles from "./ClassPreview.module.css";
import {FaRegCheckCircle, FaRegTimesCircle} from "react-icons/fa";
import {gql} from "apollo-boost";
import {useMutation} from "@apollo/react-hooks";
const CREATE_CLASS = gql`
    mutation CreateClass($name: String!) {
        createClass(name: $name) @client
        classCreateOne(className: $name) {
            name
            studentsCount
        }
    }
`;

const ClassCreator: React.FC = () => {
    const [creating, setCreating] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [createClass] = useMutation<{ classCreateOne: { name: string, studentsCount: number } },
        { name: string }>(CREATE_CLASS, {
        variables: {
            name: name.toUpperCase().replace(/\s/g, "")
        },
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
                        <FaRegTimesCircle size={20} className={`${styles.reject} ${styles.button}`} onClick={clear}/>
                        <input onChange={(e) => setName(e.target.value)} value={name} autoFocus={true} type="text"
                               className={styles.input}/>
                        <FaRegCheckCircle onClick={confirm} className={`${styles.confirm} ${styles.button}`} size={20}/>
                    </form> :
                    <div onClick={() => setCreating(true)}>Create class</div>
                }
            </div>
        </div>
    )
}

export default ClassCreator;