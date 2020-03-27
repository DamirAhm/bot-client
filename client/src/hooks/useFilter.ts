import {useState} from "react";

export default <T>(values: T[], defaultFilter: ((items: T) => T) = (item) => item) => {
    const [items, setItems] = useState<T[]>(values);
    const defaultId = Date.now() + "";
    const [filters, setFilters] = useState<{ [key: string]: (items: T) => T}>({
        [defaultId]: defaultFilter
    });

    const addFilter = (filter: (val: T) => T): () => void => {
        const id = Date.now() + "";

        setItems(items.filter(filter));
        setFilters({...filters,[id]:filter});

        return () => removeFilter(id);
    };

    const removeFilter = (id: string): void => {
        setFilters(Object.fromEntries<(val: T) => T>(Object.entries<(val: T) => T>(filters).filter(e => e[0] !== id)));
        setItems(Object.values<(val: T) => T>(filters).reduce((acc, c) => acc.filter(c), items))
    };

    const changeFilter = (id: string, filter: (val: T) => T): void => {
        setFilters({...filters, [id]: filter});
    };

    const clearFilters = () => setFilters({});

    return {items, addFilter, removeFilter, changeFilter, defaultId, setItems};
};
