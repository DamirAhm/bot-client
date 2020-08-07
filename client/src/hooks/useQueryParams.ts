import { useLocation } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";

type map = [string, (val: string) => Object];
export const parseQueryString = (qs: string): { [key: string]: string } => {
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
export const mapParams = (
    params: { [key: string]: string },
    paramsMaps: map[]
) => {
    const entries = Object.entries(params);

    const mappedEntries = entries.map(([key, value]) => {
        let mapper =
            paramsMaps.find(([paramName]) => paramName === key)?.[1] || String;

        if (mapper === Object) {
            mapper = JSON.parse;
        }

        return [key, mapper(value)];
    });

    return Object.fromEntries(mappedEntries);
};

const useQueryParams = (maps: map[] = []) => {
    const location = useLocation();

    //@ts-ignore after making push to history location get replaced by {action, location}
    const { search } = location.action ? location.location : location;
    const [queryParams, setQueryParams] = useState({});

    useEffect(() => {
        const newParams = parseQueryString(search);
        const mappedParams = mapParams(newParams, maps);
        setQueryParams(mappedParams);
    }, [search]);

    return queryParams;
};

export default useQueryParams;
