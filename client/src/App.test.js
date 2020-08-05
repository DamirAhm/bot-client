import React from "react";
import { render, cleanup } from "@testing-library/react";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { MockedProvider } from "@apollo/client/testing";
import { GET_CLASSES } from "./components/Content/Classes/Classes.tsx";

const mocks = [
    {
        request: {
            query: GET_CLASSES,
        },
        result: {
            data: {
                classes: [
                    {
                        studentsCount: 1,
                        name: "10А",
                    },
                    {
                        studentsCount: 0,
                        name: "10Б",
                    },
                ],
            },
        },
    },
];

test("renders fallback and sidebar", () => {
    const { queryByText } = render(
        <MockedProvider mocks={mocks} addTypename={false}>
            <BrowserRouter>
                <App />
            </BrowserRouter>
        </MockedProvider>
    );

    const fallback = queryByText("Loading...");
    const sidebar = queryByText("Классы");
    expect(sidebar).not.toBeNull();
    expect(fallback).not.toBeNull();
});
