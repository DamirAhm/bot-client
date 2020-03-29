import React, {useEffect, useState} from "react";
import styles from "./Students.module.css";
import {gql} from "apollo-boost";
import {useQuery} from "@apollo/react-hooks";
import {roles} from "../../../types";
import StudentPreview from "./StudentPreview/StudentPreview";
import useList from "../../../hooks/useList";
import Filters from "../../Filters/Filters";

export const GET_STUDENTS = gql`
    {
        students: studentMany {
            vkId,
            class {
                name
            }
            role
            banned
            created
        }
    }
`;

export type studentPreview = {
    vkId: number
    class: {
        name: string
    }
    role: roles,
    banned: boolean,
    created: Date
}

export type sort = {
    name: string,
    sort: (a: any, b: any) => number;
}

const Students: React.FC = () => {
    const {data, loading, error} = useQuery<{ students: studentPreview[] }>(GET_STUDENTS);
    const {items, setSort, setFilter, setItems} = useList<studentPreview>([]);
    const [text, setText] = useState("");
    const sorts: sort[] = [
        {
            name: "Классу",
            sort: (a: studentPreview, b: studentPreview) => a?.class?.name !== undefined ? (a.class.name > b?.class?.name ? 1 : -1) : 1
        },
        {
            name: "Роли",
            sort: (a: studentPreview, b: studentPreview) => a.role > b.role ? 1 : -1
        },
        {
            name: "vkId",
            sort: (a: studentPreview, b: studentPreview) => a.vkId - b.vkId
        },
        {
            name: "Забаненности",
            sort: (a: studentPreview, b: studentPreview) => a.banned ? 1 : -1
        }
    ];

    useEffect(() => {
        if (data?.students) {
            setItems(data.students);
        }
    }, [data?.students]);

    const setSearchText = (str: string): void => {
        str = str.toLowerCase();
        const _class = (item: studentPreview) => item?.class?.name || "Нету";
        setText(str);
        setFilter(item => String(item.vkId).search(str) !== -1 || _class(item).toLowerCase().search(str) !== -1 || item.role.toLowerCase().search(str) !== -1)
    };
    const setSorting = (name: string) => {
        const sort = sorts.find(e => e.name === name)?.sort;
        if (sort) {
            setSort(sort)
        } else {
            setSort(() => 1)
        }
    };
    if (loading) return <div> Loading... </div>;
    if (error) return <div style={{padding: "10px"}}> Error: {JSON.stringify(error, null, 2)} </div>;
    if (items.length) {
        return (
            <div>
                <Filters className={styles.filters} setSearchText={setSearchText} sortsList={sorts} setSort={setSorting}/>
                <div className={styles.students}>
                    {items.map(c => <StudentPreview searchText={text} key={c.vkId} vkId={c.vkId} banned={c.banned}
                                                    role={c.role}
                                                    className={c.class ? c.class.name : "Нету"}/>)}
                </div>
            </div>
        )
    }
    return null
};

export default Students;