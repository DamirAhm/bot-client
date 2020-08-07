import { render, act } from "@testing-library/react";
import { createMemoryHistory } from "history";
import useQueryParams, { parseQueryString } from "./useQueryParams";
import { Router, useHistory } from "react-router-dom";
import React, { useEffect } from "react";

test("returns right search params", () => {
    const history = createMemoryHistory({
        initialEntries: ["/?vkId=0&index=-1"],
    });

    let params;

    const TestComp = () => {
        params = useQueryParams();

        return <div></div>;
    };

    render(
        <Router history={history}>
            <TestComp />
        </Router>
    );

    act(() => {
        history.push({ pathname: "/", search: "?vkId=0&index=-1" });
    });
    expect(params).toEqual({ vkId: "0", index: "-1" });
    act(() => {
        history.push({ pathname: "/", search: "?a=b&b=c" });
    });
    expect(params).toEqual({ a: "b", b: "c" });
    act(() => {
        history.push({ pathname: "/", search: "?" });
    });
    expect(params).toEqual({});
});

test("parseQueryString parses string in the right way", () => {
    expect(parseQueryString("?a=b&b=c")).toEqual({ a: "b", b: "c" });
    expect(parseQueryString("?b=c&c=d")).toEqual({ b: "c", c: "d" });
    expect(parseQueryString("?b=&c=d")).toEqual({ b: "", c: "d" });
    expect(parseQueryString("?")).toEqual({});
    expect(parseQueryString(undefined)).toEqual({});
});
test("thorws error if query string does not match format", () => {
    expect(() => parseQueryString("!a=b")).toThrowError(
        "Query string does not match search string format, you passed: !a=b"
    );
});
