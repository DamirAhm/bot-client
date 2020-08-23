import { useCallback, useState } from "react";

export default <T>(
    values: T[],
    defaultFilter: (items: T) => boolean = () => true,
    defaultSort: (a: T, b: T) => number = () => 0
) => {
    const [initialValues, setInitialValues] = useState<T[]>([]);
    const [items, setItems] = useState<T[]>(
        values.filter(defaultFilter).sort(defaultSort)
    );

    const setFilter = (...filters: typeof defaultFilter[]) => {
        setItems(filters.reduce((acc, c) => acc.filter(c), initialValues));
    };
    const setSort = (sort: typeof defaultSort) => {
        setItems([...initialValues.sort(sort)]);
    };
    const setValue = useCallback(
        (vals: T[]) => {
            setInitialValues(vals);
            setItems(vals);
        },
        [setInitialValues, setItems]
    );

    return {
        items,
        setFilter,
        setSort,
        setItems: setValue,
    };
};
