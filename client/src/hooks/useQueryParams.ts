import { useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

export const parseQueryString = (qs: string): { [key: string]: Object } => {
    if (qs != undefined) {
        if (/\?(.+=.+&)*(.+=.+)?/.test(qs)) {
            qs = qs.slice(1);

            if (qs.trim() !== "") {
                const entries = qs.split("&");

                return Object.fromEntries(entries.map((en) => en.split("=")));
            } else {
                return {};
            }
        } else {
            throw new Error(
                "Query string does not match search string format, you passed: " +
                    qs
            );
        }
    } else {
        return {};
    }
};

const useQueryParams = () => {
    const location = useLocation();

    //@ts-ignore after making push to history location get replaced by {action, location}
    const { search } = location.action ? location.location : location;
    const [queryParams, setQueryParams] = useState({});

    useEffect(() => {
        const newParams = parseQueryString(search);
        setQueryParams(newParams);
    }, [search]);

    return queryParams;
};

export default useQueryParams;
