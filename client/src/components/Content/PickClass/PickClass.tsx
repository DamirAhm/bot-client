import { useApolloClient, useMutation, useQuery } from "@apollo/react-hooks";
import { gql } from "apollo-boost";
import React, { useContext } from "react";
import { useHistory } from "react-router-dom";
import { UserContext } from "../../../App";
import { Student, User } from "../../../types";
import Suspender from "../../Common/Suspender/Suspender";
import { classPreview, GET_CLASSES } from "../Classes/Classes";
import { CHANGE_CLASS, GET_STUDENT } from "../StudentPage/StudentPage";
import styles from "./PickClass.module.css";

type fn<T> = (value: T) => T;

const GET_STUDENT_BY_ID = gql`
    query GetStudentByVkId($vkId: Float!) {
        studentOne(filter: { vkId: $vkId }) {
            vkId
            className
            role
            settings {
                notificationsEnabled
                notificationTime
            }
            lastHomeworkCheck
            fullName
            _id
        }
    }
`;

const PickClass: React.FC<{ setUser: (fn: fn<User | null>) => void }> = ({
    setUser,
}) => {
    const query = useQuery<{ classes: classPreview[] }>(GET_CLASSES);
    const [changeClass] = useMutation<
        {
            changeClass: Partial<Student> & { __typename: string };
            __typename: string;
        },
        { vkId: number; className: string }
    >(CHANGE_CLASS);
    const ApolloClient = useApolloClient();

    const { uid } = useContext(UserContext);
    const history = useHistory();

    const onClick = (className: string) => {
        changeClass({
            variables: {
                className,
                vkId: uid,
            },
            optimisticResponse: {
                changeClass: {
                    vkId: uid,
                    __typename: "Student",
                    className: className,
                },
                __typename: "Mutation",
            },
            update: async (proxy, response) => {
                if (response.data) {
                    let data;
                    try {
                        data = proxy.readQuery<
                            { studentOne: Student },
                            { vkId: number }
                        >({
                            query: GET_STUDENT,
                            variables: {
                                vkId: uid,
                            },
                        });
                    } catch (e) {
                        data = await ApolloClient.query<
                            { studentOne?: Student },
                            { vkId: number }
                        >({
                            query: GET_STUDENT_BY_ID,
                            variables: {
                                vkId: uid,
                            },
                        }).then((res) => res.data);

                        if (!data.studentOne) {
                            return;
                        }
                    }

                    if (data) {
                        const { studentOne } = data;

                        if (studentOne) {
                            setUser((user) =>
                                user ? { ...user, ...studentOne } : null
                            );

                            history.push(`/classes/${className}`);
                        }
                    }
                }
            },
        });
    };

    return (
        <Suspender query={query}>
            {(data?: { classes?: classPreview[] }) => {
                if (data?.classes) {
                    return (
                        <div className={styles.container}>
                            <span className={styles.title}>
                                В каком классе вы учитесь? 📚
                            </span>
                            {data.classes.map((Class) => (
                                <div
                                    onClick={() => onClick(Class.name)}
                                    className={styles.class}
                                    key={Class.name}
                                >
                                    {" "}
                                    {Class.name}{" "}
                                </div>
                            ))}
                        </div>
                    );
                } else {
                    return (
                        <div>
                            {" "}
                            Простите похоже у вас не получится выбрать класс 😕{" "}
                        </div>
                    );
                }
            }}
        </Suspender>
    );
};

export default PickClass;
