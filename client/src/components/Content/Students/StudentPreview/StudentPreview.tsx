import React, {memo} from "react";
import styles from "./StudentPreview.module.css";
import {roles} from "../../../../types";
import {FaRegCheckCircle, FaRegTimesCircle} from "react-icons/fa";
import {gql} from "apollo-boost";
import {useMutation} from "@apollo/react-hooks";
import {highlightSearch} from "../../../../utils/functions";

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