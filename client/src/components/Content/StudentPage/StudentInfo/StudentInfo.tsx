import React, { useState } from "react";
import styles from "./StudentInfo.module.css";
import { parseDate } from "../../../../utils/date";
import { changeHandler } from './Changer';
import Changer from './Changer';

type Props = {
    name: string
    value: number | string | object | boolean | Date
    changeHandler: changeHandler
    isChanging: boolean
}

export const infos: { [key: string]: string } = {
    vkId: "ВК id",
    role: "Роль",
    settings: "Настройки",
    notificationsEnabled: "Уведомления включены",
    notificationTime: "Время напоминания",
    lastHomeworkCheck: "Последняя проверка дз",
    className: "Класс"
};

const convertValue = (value: string | boolean | object | Date | number) => {
    if (typeof value === "boolean") return value ? "Да" : "Нет";
    return value;
};

const StudentInfo: React.FC<Props> = ({ name, value, changeHandler, isChanging }) => {
    if (name !== "__typename" && value !== null) {
        const text = convertValue(value);
        return (
            <div className={styles.info}>
                {!isChanging || name === "vkId" ?
                    <div className={`${styles.showing}`}>
                        {typeof value == "string" || typeof value == "number" || typeof value === "boolean"
                            ? <div className={styles.value}>{infos[name] || name}: {text}</div>
                            : <div className={styles.value}>
                                {infos[name] || name}:
                                <div className={styles.nested}>
                                    {Object.entries(value).map(entrie => <StudentInfo isChanging={isChanging}
                                        name={entrie[0]} value={entrie[1]}
                                        key={name + entrie[0]}
                                        changeHandler={(pole: string, value: number | boolean | string) => changeHandler(`${name}.${pole}`, value)} />)}
                                </div>
                            </div>
                        }
                    </div> :
                    <Changer changeHandler={changeHandler} name={name} value={value} />
                }
            </div>
        )
    } else if (name && value === null) {
        return <div className={styles.info}>
            {!isChanging ?
                <div className={`${styles.showing}`}>
                    <div className={styles.value} > {infos[name] || name}: {"Не указано"}</div>
                </div>
                : <Changer changeHandler={changeHandler} name={name} value={value} />
            }
        </div>
    }
    return <></>;
}

export default StudentInfo;