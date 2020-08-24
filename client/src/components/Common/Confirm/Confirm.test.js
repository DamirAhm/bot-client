import React from "react";
import { render } from "@testing-library/react";
import Confirm from "./Confirm";
import { queryByText } from "@testing-library/dom";

beforeEach(() => {
    const modalContainer = document.createElement("div");
    modalContainer.id = "confirmModal";
    document.body.appendChild(modalContainer);
});
afterEach(() => {
    const modalRoot = document.querySelector("#confirmModal");
    modalRoot.remove();
});

test("renders modal with given title and buttons", () => {
    const modalRoot = document.querySelector("#confirmModal");

    const props = {
        text: "Test text",
        confirmElement: <div data-testid={"1"}> Confirm </div>,
        rejectElement: <div data-testid={"2"}> Reject </div>,
    };

    const modal = render(<Confirm {...props} />);

    expect(queryByText(modalRoot, "Test text")).not.toBeNull();

    expect(modal.queryByText("Test text")).not.toBeNull();

    const confirmBtn = modal.getByText("Confirm");
    const rejectBtn = modal.getByText("Reject");

    expect(confirmBtn.dataset.testid).toBe("1");
    expect(rejectBtn.dataset.testid).toBe("2");
});
test("returns right values on click on buttons", () => {
    const props = {
        onConfirm: jest.fn(),
        onReject: jest.fn(),
        returnRes: jest.fn(),
    };

    const modal = render(<Confirm {...props} />);

    const confirmBtn = modal.getByTestId("confirm");
    const rejectBtn = modal.getByTestId("reject");

    confirmBtn.click();

    expect(props.onConfirm).toBeCalledTimes(1);
    expect(props.onReject).toBeCalledTimes(0);
    expect(props.returnRes).toBeCalledTimes(1);
    expect(props.returnRes).toBeCalledWith(true);

    rejectBtn.click();

    expect(props.onConfirm).toBeCalledTimes(1);
    expect(props.onReject).toBeCalledTimes(1);
    expect(props.returnRes).toBeCalledTimes(2);
    expect(props.returnRes).toBeCalledWith(false);
});
