import React from "react";
import { render } from "@testing-library/react";
import Accordion from "./Accordion";

test("renders given head and body", () => {
    const Head = <div>Head</div>;
    const Body = <div>Body</div>;

    const accordion = render(<Accordion Head={Head}>{Body}</Accordion>);

    expect(accordion.queryByText("Head")).not.toBeNull();
    expect(accordion.queryByText("Body")).not.toBeNull();
});
test("doesn't render body if initiallyOpened passed as false", () => {
    const Head = <div>Head</div>;
    const Body = <div>Body</div>;

    const accordion = render(
        <Accordion initiallyOpened={false} Head={Head}>
            {Body}
        </Accordion>
    );

    expect(accordion.queryByText("Head")).not.toBeNull();
    expect(accordion.queryByText("Body")).toBeNull();
});
test("toggles body opened on click on Head", () => {
    const Head = <div>Head</div>;
    const Body = <div>Body</div>;

    const accordion = render(
        <Accordion initiallyOpened={false} Head={Head}>
            {Body}
        </Accordion>
    );

    const renderedHead = accordion.queryByText("Head");
    renderedHead.click();

    expect(accordion.queryByText("Body")).not.toBeNull();
});
test("passes opened state to Head and body component", () => {
    const Head = ({ opened }) => (
        <div data-opened={opened ? "1" : "0"}>Head</div>
    );
    const Body = (opened) => <div data-opened={opened ? "1" : "0"}>Body</div>;

    const accordion = render(<Accordion Head={Head}>{Body}</Accordion>);

    const renderedHead = accordion.queryByText("Head");
    const renderedBody = accordion.queryByText("Body");

    expect(renderedHead.dataset.opened).toBe("1");
    expect(renderedBody.dataset.opened).toBe("1");

    renderedHead.click();

    expect(renderedHead.dataset.opened).toBe("0");
});
