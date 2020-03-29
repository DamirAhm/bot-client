import {useState} from "react";

export default <T>(values: T[], defaultFilter: ((items: T) => boolean) = () => true, defaultSort: ((a: T, b: T) => number) = () => 0) => {
    const [initialValues, setInitialValues] = useState<T[]>([]);
    const [items, setItems] = useState<T[]>(values.filter(defaultFilter).sort(defaultSort));

    const setFilter = (filter: typeof defaultFilter) => {
        setItems(initialValues.filter(filter));
    };
    const setSort = (sort: typeof defaultSort) => {
        setItems([...initialValues.sort(sort)]);
    };

    return {items, setFilter, setSort, setItems: (vals: T[]) => {setInitialValues(vals); setItems(vals)}};
};
