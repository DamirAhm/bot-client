import React, {memo} from "react";
import styles from "./StudentPreview.module.css";
import {roles} from "../../../../types";
import {FaRegCheckCircle, FaRegTimesCircle} from "react-icons/fa";
import {gql} from "apollo-boost";
import {useMutation} from "@apollo/react-hooks";

type Props = {
    vkId: number
    className: string
    banned: boolean
    role: roles,
    searchText: string
}

const BAN = gql`
    mutation BanStudent($vkId: Int!, $isBan: Boolean){
        banStudent(vkId: $vkId, isBan: $isBan) {
            banned
            vkId
        }
    }
`;

const StudentPreview: React.FC<Props> = ({vkId,role,banned,className, searchText}) => {
    const [banStudent] = useMutation<
    {banStudent: {banned: boolean, vkId: number, __typename: string}, __typename: string}, {vkId: number, isBan?: boolean}
    >(BAN, {
        variables: {
            vkId,
            isBan: !banned
        },
        optimisticResponse: {
            __typename: "Mutation",
            banStudent: {
                banned: !banned,
                vkId,
                __typename: "Student"
            }
        }
    });

    const highlightSearch = (str: string, searchString: string, highlightClass = styles.highlight) => {
        if (searchString.trim() !== "") {
            const string = str.toLowerCase();
            searchString = searchString.toLowerCase();
            const ind = string.search(searchString);
            if (ind !== -1) {
                return<span> {str.slice(0, ind)} <span className={highlightClass}> {str.slice(ind, ind + searchString.length)} </span> {str.slice(ind + searchString.length, str.length - ind + searchString.length)} </span>
            }
        }
        return <span> {str} </span>
    };

    const highlighter = (str: string) => {
        return highlightSearch(str, searchText);
    };

    return (
        <div className={`${styles.preview} ${banned && styles.banned}`}>
            <span> vkId: {highlighter(String(vkId))} </span>
            <span> Роль: {highlighter(role)} </span>
            <span> Класс: {highlighter(className)} </span>
            {banned ?
                <FaRegCheckCircle onClick={() => {banStudent()}} className={`${styles.unban} ${styles.button}`}/>:
                <FaRegTimesCircle onClick={() => {banStudent()}} className={`${styles.ban} ${styles.button}`}/>
            }
        </div>
    )
};

export default memo(StudentPreview);