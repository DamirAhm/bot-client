// @ts-ignore
import React, { useState } from "react";
// @ts-ignore
import styles from "./StudentPage.module.css";
import { gql } from "apollo-boost";
import { useQuery, useMutation } from "@apollo/react-hooks";
import { Student } from "../../../types";
import { FaPen, FaRegCheckCircle, FaRegTimesCircle, FaCheck } from "react-icons/fa";
import { IoIosTrash } from "react-icons/io";
import StudentInfo from "./StudentInfo/StudentInfo";
import { parseDate } from "../../../utils/date";

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
        }
        getRoles
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
    fragment Student on Student {
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
        __typename
    }
    mutation UpdateStudent($record: UpdateOneStudentInput!, $vkId: Float!) {
        updatedStudent: studentUpdateOne(filter: {vkId: $vkId}, record: $record) {
            record {
                ...Student
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

const token = "0c44f72c9eb8568cdc477605a807a03b5f924e7cf0a18121eff5b8ba1b886f3789496034c2cc75bc83924";
const StudentPage: React.FC<Props> = ({ vkId }) => {
    const { data, loading, error } = useQuery<{ studentOne: Student & { __typename: string } }>(GET_STUDENT, { variables: { vkId } });
    const [changing, setChanging] = useState(false);
    const iconSize = 30;

    const diff: { [key: string]: any } = {};
    const [updater] = useMutation<
        { updatedStudent: Partial<Student> & { __typename: string }, __typename: string },
        { record: Partial<Student>, vkId: number }>(UPDATE_STUDENT);
    const [changeClass] = useMutation<
        { changeClass: Partial<Student> & { __typename: string }, __typename: string },
        { vkId: number, className: string }>(CHANGE_CLASS);

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
        } else {
            diff[path] = value;
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
                    return
                }
            } else {
                return;
            }
        }
        if (diff.lastHomeworkCheck) {
            if (!Date.parse(diff.lastHomeworkCheck)) {
                return;
            }
        }
        if (Object.getOwnPropertyNames(diff).length) {

            updater({
                variables: { vkId, record: diff },
                optimisticResponse: {
                    __typename: "Mutation",
                    updatedStudent: {
                        __typename: "Student",
                        vkId,
                        ...diff
                    }
                }
            })
        }
    }

    if (error) return <div>error: {JSON.stringify(error, null, 2)}</div>;
    else if (loading) return <div>Loading...</div>;
    else if (data?.studentOne) {
        const { fullName, banned, __typename, ...info } = data.studentOne;
        info.className = info.className || "Нету";
        info.lastHomeworkCheck = info.lastHomeworkCheck === "1970-01-01T00:00:00.000Z" ? "Никогда" : parseDate(info.lastHomeworkCheck, "YYYY.MMn.dd hh:mm");

        return (
            <div className={styles.student}>
                <div className={styles.header}>
                    <div className={styles.info}>
                        <div className={styles.name}> {fullName} </div>
                        <div className={styles.vkId}> {vkId} </div>
                    </div>
                    <div className={styles.icons}>
                        {changing ?
                            <FaCheck onClick={() => { updateStudent(); setChanging(false) }} className={`${styles.check} ${styles.icon}`} size={iconSize} /> :
                            <FaPen onClick={() => setChanging(true)} className={`${styles.icon} ${styles.pen}`} size={iconSize * 0.9} />
                        }
                        {banned ?
                            <FaRegCheckCircle className={`${styles.icon} ${styles.unban}`} size={iconSize} /> :
                            <FaRegTimesCircle className={`${styles.icon} ${styles.ban}`} size={iconSize} />
                        }
                        <IoIosTrash className={`${styles.icon} ${styles.trash}`} size={iconSize} />
                    </div>
                </div>
                <div className={styles.body}>
                    {Object.entries(info).map(entrie => <StudentInfo name={entrie[0]} value={entrie[1]} isChanging={changing} key={`${entrie[0]}`} changeHandler={changeHandler} />)}
                </div>
            </div>
        )
    }
    return null;
};

export default StudentPage;