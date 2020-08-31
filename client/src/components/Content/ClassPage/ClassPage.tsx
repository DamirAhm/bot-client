import React, { useState } from 'react'
import styles from './ClassPage.module.css'
import StudentsSection from "./Sections/StudentSection/StudentsSection";
import ScheduleSection from "./Sections/ScheduleSection/ScheduleSection";
import HomeworkSection from "./Sections/HomeworkSection/HomeworkSection";
import AnnouncementsSection from "./Sections/ChangesSection/AnnouncementsSection";
import { gql } from 'apollo-boost';
import { useMutation } from '@apollo/react-hooks';
import { WithTypename, Class, redactorOptions } from '../../../types';
import { GET_CLASSES } from "../Classes/Classes";
import { Redirect, useParams } from "react-router-dom";
import Options from "../../Common/Options/Options";
import Confirm from "../../Common/Confirm/Confirm";

const REMOVE_CLASS = gql`
    mutation RemoveClass($className: String!) {
        classRemoveOne(className: $className) {
            name
        }
    } 
`

const ClassPage: React.FC = () => {
    const [removeClass] = useMutation<WithTypename<{ classRemoveOne: WithTypename<{ name: string }> }>, { className: string }>(REMOVE_CLASS);
    const { className } = useParams<{ className: string }>();
    const [waitForConfirm, setWaitForConfirm] = useState(false);

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
        <>
            <div className={styles.class}>
                <div className={styles.header}>
                    <div className={styles.className}> {className} </div>
                    <Options
                        include={redactorOptions.delete}
                        props={{
                            onClick: () => setWaitForConfirm(true),
                            size: 30,
                            className: "remove",
                            style: { cursor: "pointer" },
                            allowOnlyAdmin: true
                        }}
                    />
                </div>
                <div className={styles.content}>
                    <StudentsSection className={className} />
                    <ScheduleSection className={className} />
                    <HomeworkSection className={className} />
                    <AnnouncementsSection className={className} />
                </div>
            </div>
            {waitForConfirm &&
                <Confirm text={`Вы уверены что хотите удалить ${className} класс? 😕`} onConfirm={remove} returnRes={() => setWaitForConfirm(false)} />
            }
        </>
    )
}

export default ClassPage