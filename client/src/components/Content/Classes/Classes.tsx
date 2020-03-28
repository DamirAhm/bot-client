import React from "react";
import {gql} from "apollo-boost";
import {useQuery} from "@apollo/react-hooks";
import ClassPreview from "./ClassPreview/ClassPreview";
import styles from "./Classes.module.css";
import ClassCreator from "./ClassPreview/ClassCreator";

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
    classes: {
        studentsCount: number,
        name: string
    }[]
}

const Classes: React.FC = () => {
    const {data, loading, error} = useQuery<classesData>(GET_CLASSES);
    if (loading) return <div> Loading... </div>;
    if (error) return <div className={"content"}> Error: {JSON.stringify(error, null, 2)} </div>;

    return <div className="content">
        <ClassCreator />
        <div className={styles.classes} style={{marginTop: "20px"}}>
            {data?.classes?.map(c => <ClassPreview key={c.name} className={c.name} studentsCount={c.studentsCount}/>)}
        </div>
    </div>
};

export default Classes;