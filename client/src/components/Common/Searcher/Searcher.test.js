import React from "react";
import {
    fireEvent,
    render,
    act
} from "@testing-library/react";
import Searcher from "./Searcher";

test( "renders input and clear button", () => {
    const searcher = render( <Searcher /> );

    expect( searcher.queryByTestId( "input" ) ).not.toBeNull();
    expect( searcher.queryByTestId( "clear-btn" ) ).not.toBeNull();
} );
test( "input has given value", () => {
    let searcher = render( <Searcher value="test text" /> );

    expect( searcher.queryByTestId( "input" ).value ).toBe( "test text" );

    searcher.unmount();

    searcher = render( <Searcher value="different text" /> );

    expect( searcher.queryByTestId( "input" ).value ).toBe( "different text" );
} );
test( "calls changeHandler on change of input", () => {
    const changeHandler = jest.fn();

    const searcher = render( <Searcher onChange={changeHandler} /> );

    const input = searcher.queryByTestId( "input" );

    act( () => {
        fireEvent.change( input, {
            target: {
                value: "awdaw"
            }
        } )
    } );

    expect( changeHandler ).toBeCalledTimes( 1 );
    expect( input.value ).toBe( "awdaw" );
} ); test( "clear button send empty value to change handler", () => {
    const changeHandler = jest.fn();
    const searcher = render( <Searcher onChange={changeHandler} value="123" /> );

    const input = searcher.queryByTestId( "input" );
    const clear_btn = searcher.queryByTestId( "clear-btn" );

    act( () => { fireEvent.click( clear_btn ) } )

    expect( changeHandler ).toBeCalledTimes( 1 );
    expect( changeHandler ).toBeCalledWith( "" );
} );