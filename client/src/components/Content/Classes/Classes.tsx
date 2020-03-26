import React from "react";
import {gql} from "apollo-boost";
import {useQuery} from "@apollo/react-hooks";
import ClassPreview from "./ClassPreview/ClassPreview";
import styles from "./Classes.module.css";

export const GET_CLASSES = gql`
    {
        classes: classMany {
            count: studentsCount
            name
        }
    }
`;

type classesData = {
    classes: {
        count: number,
        name: string
    }[]
}

const Classes: React.FC = ({}) => {
    const {data, loading, error} = useQuery<classesData>(GET_CLASSES);

    if (loading) return <div> Loading... </div>;
    if (error) return <div> Error: {error} </div>;

    return <div className={styles.classes}>
        {data?.classes?.map(c => <ClassPreview key={c.name} className={c.name} studentsCount={c.count}/>)}
    </div>
};

export default Classes;