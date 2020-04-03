import React, { memo } from "react";
import styles from "./StudentPreview.module.css";
import { roles } from "../../../../types";
import { FaRegCheckCircle, FaRegTimesCircle } from "react-icons/fa";
import { gql } from "apollo-boost";
import { useMutation } from "@apollo/react-hooks";
import { highlightSearch } from "../../../../utils/functions";
import { Link } from "react-router-dom";
import { GiSpiralTentacle } from "react-icons/gi";

type Props = {
    vkId: number
    className: string
    banned: boolean
    role: roles,
    searchText: string
    name: string
}

export const BAN = gql`
    mutation BanStudent($vkId: Int!, $isBan: Boolean){
        banStudent(vkId: $vkId, isBan: $isBan) {
            banned
            vkId
        }
    }
`;

const StudentPreview: React.FC<Props> = ({ vkId, role, banned, className, searchText, name }) => {
    const [banStudent] = useMutation<
        { banStudent: { banned: boolean, vkId: number, __typename: string }, __typename: string }, { vkId: number, isBan?: boolean }
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
    //TODO добавить обновление кеша после изменения чтоб на странице полхователей + классов тоже все менялось 
    return (
        <div className={`${styles.preview} ${banned && styles.banned}`}>
            <Link to={`/students/${vkId}`} className={`${styles.link}`}>
                <span className={styles.info}> <span className={styles.infoValue}>{highlighter(getPrettyName(name))} </span> </span>
                <span className={styles.info}> <span className={styles.infoValue}>{highlighter(getPrettyName(role))} </span> </span>
                <span className={styles.info}> <span className={styles.infoValue}>{highlighter(getPrettyName(className))} </span> </span>
            </Link>
            {banned ?
                <FaRegCheckCircle size={20} onClick={() => { banStudent() }} className={`unban ${styles.button}`} /> :
                <FaRegTimesCircle size={20} onClick={() => { banStudent() }} className={`ban ${styles.button}`} />
            }
        </div>
    )
};

export default memo(StudentPreview);

function getPrettyName(name: string): string {
    if (!name) return "Error empty name"
    return name.split(" ")[0] + " " + (name.split(" ")[1]?.[0]?.toUpperCase() || "");
}
