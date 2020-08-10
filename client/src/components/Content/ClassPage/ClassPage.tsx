import React from 'react'
import styles from './ClassPage.module.css'
import { IoIosTrash } from "react-icons/io";
import StudentsSection from "./Sections/StudentSection/StudentsSection";
import ScheduleSection from "./Sections/ScheduleSection/ScheduleSection";
import HomeworkSection from "./Sections/HomeworkSection/HomeworkSection";
import ChangesSection from "./Sections/ChangesSection/ChangesSection";
import { gql } from 'apollo-boost';
import { useMutation } from '@apollo/react-hooks';
import { WithTypename, Class } from '../../../types';
import { GET_CLASSES } from "../Classes/Classes";
import { Redirect, useParams } from "react-router-dom";

const REMOVE_CLASS = gql`
    mutation RemoveClass($className: String!) {
        classRemoveOne(className: $className) {
            name
        }
    } 
`

const ClassPage: React.FC = ({ }) => {
    const [removeClass] = useMutation<WithTypename<{ classRemoveOne: WithTypename<{ name: string }> }>, { className: string }>(REMOVE_CLASS);
    const {className} = useParams<{className: string}>();

    const remove = () => {
        removeClass({
            variables: { className },
            optimisticResponse: {
                classRemoveOne: { name: className, __typename: "Class" },
                __typename: "Mutation"
            },
            update: (proxy, res) => {
                const data = proxy.readQuery<{ classes: Class[] }>({ query: GET_CLASSES });

                if (data?.classes && res.data) {
                    proxy.writeQuery({
                        query: GET_CLASSES,
                        data: {
                            classes: data?.classes.filter(c => c.name !== res.data?.classRemoveOne.name)
                        }
                    });

                    return <Redirect to="/classes" />;
                }
            }
        })
    }

    return (
        <div className={styles.class}>
            <div className={styles.header}>
                <div className={styles.className}> {className} </div>
                <IoIosTrash size={30} className="remove" onClick={remove} style={{ cursor: "pointer" }} />
            </div>
            <div className={styles.content}>
                <StudentsSection className={className} />
                <ScheduleSection className={className} />
                <HomeworkSection className={className} />
                <ChangesSection className={className} />
            </div>
        </div>
    )
}

export default ClassPage