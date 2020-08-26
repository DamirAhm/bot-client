import React from "react";
import { render } from "@testing-library/react";
import Suspender from "./Suspender";

describe( "with one query", () => {
    test( "renders loading... if query state is loading and fallback is not passed", () => {
        const query = {
            loading: true,
            error: undefined,
            data: undefined,
        };

        const suspender = render( <Suspender query={query} /> );

        expect( suspender.queryByText( "loading..." ) ).not.toBeNull();
    } );
    test( "renders custom fallback instead of loading... if it's specified and state is loading", () => {
        const query = {
            loading: true,
            error: undefined,
            data: undefined,
        };

        const suspender = render(
            <Suspender query={query} fallback={<div>fallback</div>} />
        );

        expect( suspender.queryByText( "fallback" ) ).not.toBeNull();
        expect( suspender.queryByText( "loading..." ) ).toBeNull();
    } );
    test( "renders error if state is error", () => {
        const query = {
            loading: false,
            error: new Error( "error" ),
            data: undefined,
        };

        const suspender = render( <Suspender query={query} /> );

        expect( suspender.queryByText( "error" ) ).not.toBeNull();
    } );
    test( "renders children if data is loaded", () => {
        const query = {
            loading: false,
            error: undefined,
            data: "data",
        };

        const childFn = jest.fn();
        childFn.mockReturnValue( <div>function</div> );

        let suspender = render( <Suspender query={query}>{childFn}</Suspender> );

        expect( childFn ).toBeCalled();
        expect( suspender.queryByText( "function" ) ).not.toBeNull();

        suspender.unmount();

        suspender = render(
            <Suspender query={query}>
                <div>element</div>
            </Suspender>
        );

        expect( suspender.queryByText( "element" ) ).not.toBeNull();
    } );
    test( "renders children with passed data", () => {
        const query = {
            loading: false,
            error: undefined,
            data: "data",
        };

        const child = jest.fn();
        child.mockReturnValue( <div></div> );

        const suspender = render( <Suspender query={query}>{child}</Suspender> );

        expect( child ).toBeCalledWith( "data" );
    } );
} );
describe( "with a few queries", () => {
    test( "renders loading... if some queries is loading", () => {
        const queries = [
            { loading: false },
            { loading: true },
            { loading: true },
            { loading: false },
        ];

        let suspender = render( <Suspender queries={queries}></Suspender> );

        expect( suspender.queryByText( "loading..." ) ).not.toBeNull();
    } );
    test( "renders loading... if at least one query's state is loading", () => {
        const queries = [
            { loading: false },
            { loading: true },
            { loading: false },
            { loading: false },
        ];

        let suspender = render( <Suspender queries={queries}></Suspender> );

        expect( suspender.queryByText( "loading..." ) ).not.toBeNull();
    } );
    test( "renders errors from all queries", () => {
        const errors = [ new Error( "error1" ), new Error( "error2" ) ];

        const queries = [
            { error: errors[ 0 ] },
            { data: "data" },
            { loading: true },
            { error: errors[ 1 ] },
        ];

        let suspender = render( <Suspender queries={queries}></Suspender> );

        expect(
            errors.every( ( err ) => suspender.queryByText( err.message ) !== null )
        ).toBe( true );
    } );
    test( "passes array of datas from all queries if data is loaded in all queries", () => {
        const queries = [
            { data: "data1" },
            { data: "data2" },
            { data: "data3" },
            { data: "data4" },
        ];

        const child = jest.fn();
        child.mockReturnValue( <div>child</div> );

        let suspender = render(
            <Suspender queries={queries}>{child}</Suspender>
        );

        expect( child ).toBeCalledWith( "data1", "data2", "data3", "data4" );
        expect( suspender.queryByText( "child" ) ).not.toBeNull();
    } );
} );
