import React, { HTMLAttributes, useState } from "react";
import styles from "./Filters.module.css";
import { sort } from "../Content/Students/Students";

interface Props extends HTMLAttributes<HTMLDivElement> {
    sortsList?: sort[]
    setSort?: (fn: string) => void
    searchText?: string
    setSearchText?: (str: string) => void
    defaultSort?: string
}

const Filters: React.FC<Props> = ({ sortsList, setSearchText, setSort, defaultSort, ...props }) => {
    const [text, setText] = useState("");

    return (
        <div {...props} className={props.className || styles.filterContainer}>
            <div className={styles.filters}>
                {setSearchText &&
                    <div className={styles.search}>
                        <input style={{ color: "var(--main)" }} placeholder="Поиск" type="text" onChange={(e) => {
                            setText(e.target.value);
                            setSearchText(e.target.value)
                        }} value={text} />
                    </div>
                }
                {sortsList?.length && setSort &&
                    <div className={styles.sorts}>
                        <select onChange={e => setSort(e.target.value)} name="sorts" id="sorts" defaultValue={defaultSort
                        }>
                            {!defaultSort &&
                                <option key="none" value="none"> Сортировать по </option>
                            }
                            {
                                sortsList.map(({ name }) => <option key={name} value={name}>{name}</option>)
                            }
                        </select>
                    </div>
                }
            </div>
        </div>
    )
}

export default Filters;