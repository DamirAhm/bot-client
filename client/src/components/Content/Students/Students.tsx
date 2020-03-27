import React from "react";
import styles from "./Students.module.css";
import {gql} from "apollo-boost";
import {useQuery} from "@apollo/react-hooks";
import {roles} from "../../../types";
import StudentPreview from "./StudentPreview/StudentPreview";

export const GET_STUDENTS = gql`
    {
        students: studentMany {
            vkId,
            class {
                name
            }
            role
            banned
            _id
        }
    }
`;

export type studentPreview = {
    vkId: number
    class: {
        name: string
    }
    role: roles,
    banned: boolean
}

const Students: React.FC = () => {
    const {data, loading, error} = useQuery<{students: studentPreview[]}>(GET_STUDENTS);

    if (loading) return <div> Loading... </div>;
    if (error) return <div className={"content"} style={{padding: "10px"}}> Error: {JSON.stringify(error, null, 2)} </div>;
    if (data) {
        return <div className={styles.students + " content "}>
            {data?.students?.map(c => <StudentPreview key={c.vkId} vkId={c.vkId} banned={c.banned} role={c.role}
                                                      className={c.class ? c.class.name : "Нету"}/>)}
        </div>
    }
    return null
};

export default Students;