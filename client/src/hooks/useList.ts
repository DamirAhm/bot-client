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
        setItems(
            [...filters, defaultFilter].reduce(
                (acc, c) => acc.filter(c),
                initialValues
            )
        );
    };
    const setSort = (sort: typeof defaultSort) => {
        setItems([...items.sort(sort)]);
    };
    const setMap = (map: (value: T) => T) => {
        setItems([...items.map(map)]);
    }
    const setValue = useCallback((vals: T[]) => {
        setInitialValues(vals);
        setItems(vals.filter(defaultFilter));
    }, []);

    return {
        items,
        setFilter,
        setSort,
        setItems: setValue,
        setMap
    };
};
