import React, {useEffect, useState} from "react";
import {gql} from "apollo-boost";
import {useQuery} from "@apollo/react-hooks";
import ClassPreview from "./ClassPreview/ClassPreview";
import styles from "./Classes.module.css";
import ClassCreator from "./ClassPreview/ClassCreator";
import Filters from "../../Filters/Filters";
import {sort} from "../Students/Students";
import useList from "../../../hooks/useList";

export const GET_CLASSES = gql`
    {
        classes: classMany {
            studentsCount
            name
            __typename
        }
    }
`;

export type classesData = {
    classes: classPreview[]
}

export type classPreview = {
    studentsCount: number,
    name: string
}

const Classes: React.FC = () => {
    const {data, loading, error} = useQuery<classesData>(GET_CLASSES);
    const {items, setFilter, setSort, setItems} = useList<classPreview>([]);
    const [searchText, setText] = useState("");
    const sorts: sort[] = [
        {
            name: "Кол-ву учеников",
            sort: (a: classPreview, b: classPreview) => a.studentsCount > b.studentsCount ? -1 : 1
        },
        {
            name: "Имени",
            sort: (a: classPreview, b: classPreview) => a.name > b.name ? 1 : -1
        }
    ];

    const setSearchText = (str: string) => {
        str = str.toLowerCase();
        setText(str);
        setFilter((c: classPreview) => c.name.toLowerCase().search(str) !== -1 || c.studentsCount.toString().toLowerCase().search(str) !== -1);
    };
    const setSorting = (name: string) => {
        const sort = sorts.find(sort => sort.name === name)?.sort;
        if (sort) {
            setSort(sort);
        } else {
            setSort(() => 1)
        }
    };

    useEffect(() => {
        if (data?.classes) {
            setItems(data.classes);
        }
    }, [data?.classes]);

    if (loading) return <div> Loading... </div>;
    if (error) return <div className={"content"}> Error: {JSON.stringify(error, null, 2)} </div>;
    return <div>
        <Filters className={styles.filters} setSearchText={setSearchText} sortsList={sorts} setSort={setSorting}/>
        <ClassCreator />
        <div className={styles.classes}>
            {items.map(c => <ClassPreview searchText={searchText} key={c.name} className={c.name} studentsCount={c.studentsCount}/>)}
        </div>
    </div>
};

export default Classes;