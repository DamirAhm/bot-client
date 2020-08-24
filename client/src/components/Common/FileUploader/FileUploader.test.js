import React from "react";
import { render, fireEvent } from "@testing-library/react";
import FileUploader from "./FileUploader";

test("render view with input, with type file", () => {
    const View = <div>View</div>;

    const uploader = render(<FileUploader View={View} />);

    expect(uploader.queryByText("View")).not.toBeNull();
    expect(uploader.queryByTestId("input")).not.toBeNull();
});
test("calls onChange on upload file", () => {
    const onChange = jest.fn();

    const uploader = render(<FileUploader onChange={onChange} />);

    const input = uploader.queryByTestId("input");

    fireEvent.change(input);

    expect(onChange).toBeCalledTimes(1);
});
