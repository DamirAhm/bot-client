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

    act(() => {
        render(
            <Router history={history}>
                <TestComp />
            </Router>
        );
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
test("param maps works", () => {
    const history = createMemoryHistory({
        initialEntries: ["/?vkId=0&index=-1&plus1=0"],
    });

    let params;

    const TestComp = () => {
        params = useQueryParams([
            ["vkId", Number],
            ["plus1", (v) => +v + 1],
        ]);

        return <div></div>;
    };

    act(() => {
        render(
            <Router history={history}>
                <TestComp />
            </Router>
        );
    });

    expect(params).toEqual({ vkId: 0, index: "-1", plus1: 1 });
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
