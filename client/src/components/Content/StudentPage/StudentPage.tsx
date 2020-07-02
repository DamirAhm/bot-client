import React, { useState } from "react";
import styles from "./StudentPage.module.css";
import { gql } from "apollo-boost";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { Student } from "../../../types";
import { FaPen, FaRegCheckCircle, FaRegTimesCircle } from "react-icons/fa";
import { MdClose, MdCheck } from "react-icons/md";
import { IoIosTrash } from "react-icons/io";
import StudentInfo from "./StudentInfo/StudentInfo";
import { parseDate } from "../../../utils/date";
import { BAN } from "../Students/StudentPreview/StudentPreview";
import { Redirect } from 'react-router';
import { GET_STUDENTS } from "../Students/Students";
import Suspender from "../../Common/Suspender";

interface Props {
    vkId: number
}

export const GET_STUDENT = gql`
    query GetStudent($vkId: Float){
        studentOne(filter: {vkId: $vkId}) {
            vkId
            className
            role
            banned
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
export const GET_CLASS_LIST = gql`
    {
        classMany {
            name
        }
    }
`;
export const UPDATE_STUDENT = gql`
    mutation UpdateStudent($record: UpdateOneStudentInput!, $vkId: Float!) {
        updatedStudent: studentUpdateOne(filter: {vkId: $vkId}, record: $record) {
            record {
                vkId
                className
                role
                banned
                settings {
                    notificationsEnabled
                    notificationTime
                }
                lastHomeworkCheck
                fullName
                _id
                __typename
            }
        }
    }
`
export const CHANGE_CLASS = gql`
    mutation ChangeClass($vkId: Int!, $className: String!) {
        changeClass(vkId: $vkId, newClassName: $className) {
            __typename
            vkId
            className
        }
    }
`

export const DELETE_STUDENT = gql`
    mutation DeleteStudent($vkId: Int!) {
        removed: studentRemoveOne(vkId: $vkId) {
            vkId
        }
    }
`

const token = "0c44f72c9eb8568cdc477605a807a03b5f924e7cf0a18121eff5b8ba1b886f3789496034c2cc75bc83924";
const StudentPage: React.FC<Props> = ({ vkId }) => {
    const [changing, setChanging] = useState(false);
    const [diff, setDiff] = useState<{ [key: string]: any }>({});
    const [removed, setRemoved] = useState(false);
    const iconSize = 30;

    const { data, loading, error } = useQuery<
        { studentOne: Student & { __typename: string } }
    >(GET_STUDENT, { variables: { vkId } });

    const [ban] = useMutation<
        { banStudent: Partial<Student> & { __typename: string }, __typename: string },
        { vkId: number, isBan?: boolean }>(BAN);
    const [updater] = useMutation<
        { updatedStudent: { record: Partial<Student> & { __typename: string }, __typename: string }, __typename: string },
        { record: Partial<Student>, vkId: number }>(UPDATE_STUDENT);
    const [changeClass] = useMutation<
        { changeClass: Partial<Student> & { __typename: string }, __typename: string },
        { vkId: number, className: string }>(CHANGE_CLASS);
    const [deleter] = useMutation<
        { removed: { vkId: number, __typename: string }, __typename: string },
        { vkId: number }>(DELETE_STUDENT);

    const banStudent = (isBan: boolean) => {
        const content = document.querySelector(".content");
        content?.classList.remove("unbanned", "banned");
        content?.classList.add(!isBan ? "unbanned" : "banned");
        ban({
            variables: {
                vkId,
                isBan: isBan
            },
            optimisticResponse: {
                __typename: "Mutation",
                banStudent: {
                    banned: isBan,
                    vkId,
                    __typename: "Student"
                }
            }
        })
    }
    //TODO add popup to make sure you want to delete st
    const deleteStudent = () => {
        deleter({
            variables: {
                vkId
            },
            optimisticResponse: {
                __typename: "Mutation",
                removed: {
                    vkId,
                    __typename: "Student"
                }
            },
            update: (proxy, response) => {
                const data = proxy.readQuery<{ students: Student[] }>({ query: GET_STUDENTS });

                proxy.writeQuery({
                    query: GET_STUDENTS,
                    data: {
                        students: data?.students.filter(s => s.vkId !== response?.data?.removed.vkId)
                    }
                });
                //TODO почему появляются ошибки
                setRemoved(true);
            }
        });
    }

    const changeHandler = (path: string, value: boolean | string | number) => {
        if (path.search(".") !== -1) {
            const poles = path.split(".");
            let t: any = diff;
            for (const pole of poles.slice(0, poles.length - 1)) {
                if (t[pole]) t = diff[pole];
                else {
                    t[pole] = {};
                    t = t[pole];
                }
            }
            t[poles[poles.length - 1]] = value;
            setDiff({ ...diff });
        } else {
            setDiff({ ...diff, path: value });
        }
    };
    const updateStudent = () => {
        if (diff.className) {
            const { className } = diff;
            if (typeof className === "string") {
                changeClass({
                    variables: { className, vkId },
                    optimisticResponse: {
                        changeClass: { vkId, __typename: "Student", className: className },
                        __typename: "Mutation"
                    }
                });
                delete diff.className
            }
        }
        if (diff.settings?.notificationTime) {
            const [f, s] = diff.settings?.notificationTime.split(":").map(Number).filter(Number.isInteger);
            if (f && s) {
                if (!(f >= 0 && f <= 23) || !(s >= 0 && s <= 59)) {
                    delete diff.settings.notificationTime;
                }
            } else {
                delete diff.settings.notificationTime;
            }
        }
        if (diff.lastHomeworkCheck) {
            if (!Date.parse(diff.lastHomeworkCheck)) {
                delete diff.lastHomeworkCheck;
            }
        }
        if (Object.getOwnPropertyNames(diff).length) {
            const settings = diff.settings;
            delete diff.settings;
            console.log({ ...diff, settings })
            updater({
                variables: { vkId, record: { ...diff, settings } },
                optimisticResponse: {
                    __typename: "Mutation",
                    updatedStudent: {
                        record: {
                            __typename: "Student",
                            vkId,
                            ...data?.studentOne,
                            ...diff,
                            settings: {
                                ...data?.studentOne.settings,
                                ...settings
                            }
                        },
                        __typename: "UpdateStudent"
                    }
                }
            })
        }
    }

    if (removed) { return <Redirect to={`/students/`} /> };

    return (
        <Suspender query={{ data, loading, error }}>
            {(data: ({ studentOne: Student & { __typename: string } })) => {
                const { fullName, banned, __typename, ...info } = data.studentOne;
                info.className = info.className;
                info.lastHomeworkCheck = info.lastHomeworkCheck === "1970-01-01T00:00:00.000Z" ? "Никогда" : parseDate(info.lastHomeworkCheck, "YYYY.MMn.dd hh:mm");

                return <div className={styles.student}>
                    <div className={styles.header}>
                        <div className={styles.info}>
                            <div className={styles.name}> {fullName} </div>
                        </div>
                        <div className={styles.icons}>
                            {changing ?
                                <>
                                    <MdClose onClick={() => (setDiff({}), setChanging(false))} className={`negative ${styles.icon}`} size={iconSize} />
                                    <MdCheck onClick={() => { updateStudent(); setChanging(false) }} className={`positive ${styles.icon}`} size={iconSize} />
                                </> :
                                <FaPen onClick={() => setChanging(true)} className={`${styles.icon} ${styles.pen}`} size={iconSize * 0.9} />
                            }
                            {!changing &&
                                <>
                                    {banned ?
                                        <FaRegCheckCircle onClick={() => banStudent(false)} className={`${styles.icon} unban`} size={iconSize} /> :
                                        <FaRegTimesCircle onClick={() => banStudent(true)} className={`${styles.icon} ban`} size={iconSize} />
                                    }
                                    <IoIosTrash onClick={deleteStudent} className={`${styles.icon} remove`} size={iconSize} />
                                </>
                            }
                        </div>
                    </div>
                    <div className={styles.body}>
                        {Object.entries(info).map(entrie => <StudentInfo name={entrie[0]} value={entrie[1]} isChanging={changing} key={`${entrie[0]}`} changeHandler={changeHandler} />)}
                    </div>
                </div>
            }
            }
        </Suspender>
    )
};

export default StudentPage;