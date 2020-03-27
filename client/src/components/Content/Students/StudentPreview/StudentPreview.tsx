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
    role: roles
}

const BAN = gql`
    mutation BanStudent($vkId: Int!, $isBan: Boolean){
        banStudent(vkId: $vkId, isBan: $isBan) {
            banned
            vkId
        }
    }
`;

const StudentPreview: React.FC<Props> = ({vkId,role,banned,className}) => {
    const [banStudent] = useMutation<
        //check how to fix
    {banStudent: {banned: boolean, vkId: number}} & any, {vkId: number, isBan?: boolean}
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

    return (
        <div className={`${styles.preview} ${banned && styles.banned}`}>
            <span> Типо имя </span>
            <span> Роль: {role} </span>
            <span> Класс: {className} </span>
            {banned ?
                <FaRegCheckCircle onClick={() => {banStudent()}} className={`${styles.unban} ${styles.button}`}/>:
                <FaRegTimesCircle onClick={() => {banStudent()}} className={`${styles.ban} ${styles.button}`}/>
            }
        </div>
    )
};

export default memo(StudentPreview);