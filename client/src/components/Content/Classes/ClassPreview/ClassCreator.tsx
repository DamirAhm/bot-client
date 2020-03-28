import React, {useState} from "react";
import styles from "./ClassPreview.module.css";
import {FaRegCheckCircle, FaRegTimesCircle} from "react-icons/fa";
import {gql} from "apollo-boost";
import {useMutation, useApolloClient} from "@apollo/react-hooks";
import {GET_CLASSES} from "../Classes";
import {Class} from "../../../../types";
const CREATE_CLASS = gql`
    mutation CreateClass($name: String!) {
#        createClass(name: $name) @client
        classCreateOne(className: $name) {
            name
            __typename
            studentsCount
        }
    }
`;

const ClassCreator: React.FC = () => {
    const [creating, setCreating] = useState<boolean>(false);
    const [name, setName] = useState<string>("");
    const [createClass] = useMutation<{ classCreateOne: { name: string, studentsCount: number, __typename: string } },
        { name: string }>(CREATE_CLASS, {
        variables: {
            name: name.toUpperCase().replace(/\s/g, "")
        },
        optimisticResponse: {
            classCreateOne: {
                name,
                studentsCount: 0,
                __typename: "Class"
            }
        },
        update: (proxy, data) => {
            console.log(proxy.readQuery<{classes: any}>({query: GET_CLASSES})?.classes.concat([data]));
            proxy.writeQuery({
                query: GET_CLASSES,
                data: {
                    classes: proxy.readQuery<{classes: any}>({query: GET_CLASSES})?.classes.concat([data]),
                    __typename: "Mutation"
                }
            });
            return data;
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
        <div className={styles.wrapper} >
            <div className={`${styles.creator} ${styles.preview}`} onClick={() => setCreating(true)}>
                {creating ?
                    <form onSubmit={confirm} className={styles.form}>
                        <FaRegTimesCircle size={20} className={`${styles.reject} ${styles.button}`} onClick={clear}/>
                        <input onChange={(e) => setName(e.target.value)} value={name} autoFocus={true} type="text"
                               className={styles.input}/>
                        <FaRegCheckCircle onClick={confirm} className={`${styles.confirm} ${styles.button}`} size={20}/>
                    </form> :
                    "Create class"
                }
            </div>
        </div>
    )
}

export default ClassCreator;