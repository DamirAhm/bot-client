import React from "react";
import styles from "./StudentInfo.module.css";
import {parseDate} from "../../../../utils/date";
type Props = {
    name: string
    value: number | string | object | boolean | Date
    changeHandler: (path: string, value: string | boolean | number) => void
    isChanging: boolean
}

const infos: {[key: string]: string} = {
    vkId: "ВК id",
    role: "Роль",
    settings: "Настройки",
    notificationsEnabled: "Уведомления включены",
    notificationTime: "Время напоминания",
    lastHomeworkCheck: "Последняя проверка дз",
    className: "Класс"
};

const convertValue = (value: string | boolean | object | Date | number ) => {
    if (typeof value === "boolean") return value ? "Да" : "Нет";
    if (typeof value === "string" && !isNaN(Date.parse(value))) return Date.parse(value) === 0 ? "Никогда" : parseDate(value.toString(), "YYYY MM dd hh:mm");
    return value;
};

const StudentInfo: React.FC<Props> = ({name, value, changeHandler, isChanging}) => {
    if (name !== "__typename" && value !== null) {
        typeof value !== "object" && changeHandler(name, value);
        value = convertValue(value);
        return (
            <div className={styles.info}>
                {!isChanging ?
                    <div className={`${styles.showing}`}>
                        {typeof value == "string" || typeof value == "number" ?
                            <div className={styles.value}>{infos[name] || name}: {value}</div> :
                            <div className={styles.value}>
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
                    <div className={`${styles.changing}`}>

                    </div>
                }
            </div>
        )
    }
    return <></>;
}

export default StudentInfo;