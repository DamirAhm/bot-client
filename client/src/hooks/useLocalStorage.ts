import { useState, useEffect } from "react";

export default <T extends Object>(itemName: string, initialValue?: T) => {
    const [item, setItem] = useState<T | null | undefined>(initialValue);

    useEffect(() => {
        const localStorageData = localStorage.getItem(itemName);

        if (localStorageData) {
            setItem(JSON.parse(localStorageData));
        }

        const interval = setInterval(() => {
            if (localStorageData && localStorageData !== JSON.stringify(item)) {
                setItem(JSON.parse(localStorageData));
            }
        }, 100);

        return clearInterval(interval);
    })

    const updateItem = (newItem: T) => {
        localStorage.setItem(itemName, JSON.stringify(newItem));
        setItem(newItem);
    }

    return [item, updateItem] as const;
}