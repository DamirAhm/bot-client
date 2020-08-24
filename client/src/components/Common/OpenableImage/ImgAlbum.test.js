import React from "react";
import { render } from "@testing-library/react";
import ImgAlbum from "./ImgAlbum";
import {
    queryByAltText,
    screen,
    queryByTestId,
    fireEvent,
} from "@testing-library/dom";
import { connectImages, Image } from "./ImgAlbum";
import { attachment } from "../../../types";

test("renders list of passed attachments", () => {
    const attachments = [
        {
            url: "1 src",
            value: "fake value",
            _id: "1",
        },
        {
            url: "2 src",
            value: "yet fake value",
            _id: "2",
        },
    ];

    const album = render(<ImgAlbum images={attachments} />);

    const images = album.queryAllByAltText("Фото дз");

    expect(images).not.toBeNull();
    expect(images.length).toBe(2);

    expect(images.some((img) => img.getAttribute("src") === "1 src")).toBe(
        true
    );
    expect(images.some((img) => img.getAttribute("src") === "2 src")).toBe(
        true
    );
});
test("renders openable images", () => {
    const photoModal = document.createElement("div");
    photoModal.id = "photoModal";
    document.body.appendChild(photoModal);

    const attachments = [
        {
            url: "1 src",
            value: "fake value",
            _id: "1",
        },
        {
            url: "2 src",
            value: "yet fake value",
            _id: "2",
        },
    ];

    const album = render(<ImgAlbum images={attachments} />);

    const image = album.queryAllByAltText("Фото дз")[0];

    image?.click();
    const modalPhoto = queryByAltText(photoModal, "Фото дз");
    expect(modalPhoto).not.toBeNull();
    expect(modalPhoto?.getAttribute("src")).toBe(image.getAttribute("src"));

    photoModal.remove();
});

test("renders stab if its passed", () => {
    const attachments = [
        {
            url: "1 src",
            value: "fake value",
            _id: "1",
        },
        {
            url: "2 src",
            value: "yet fake value",
            _id: "2",
        },
    ];
    const Stab = () => <div>stab</div>;

    const album = render(<ImgAlbum images={attachments} Stab={Stab} />);

    const stab = album.queryByText("stab");

    expect(stab).not.toBeNull();
});
test("stab opens photo modal", () => {
    const photoModal = document.createElement("div");
    photoModal.id = "photoModal";
    document.body.appendChild(photoModal);

    const attachments = [
        {
            url: "1 src",
            value: "fake value",
            _id: "1",
            alt: "alt to find",
        },
        {
            url: "2 src",
            value: "yet fake value",
            _id: "2",
            alt: "alt to find 1",
        },
    ];

    const Stab = ({ onClick }) => <div onClick={onClick}>stab</div>;

    const album = render(<ImgAlbum images={attachments} Stab={Stab} />);

    const stab = album.queryByText("stab");

    stab?.click();
    const modalPhoto = queryByAltText(photoModal, "alt to find");
    expect(modalPhoto).not.toBeNull();
    expect(modalPhoto?.getAttribute("src")).toBe("1 src");

    photoModal.remove();
});

test("connect images adds prevImg and nextImg to images", () => {
    const images = [
        {
            url: "1 url",
        },
        {
            url: "2 url",
        },
    ];

    const connectedImages = connectImages(images);

    expect(
        connectedImages.every((conImg, i) => conImg.src === images[i].url)
    ).toBe(true);

    expect(connectedImages[0].nextImg).toBe(connectedImages[1]);
    expect(connectedImages[1].prevImg).toBe(connectedImages[0]);
});
test("passes all props except for url", () => {
    const images = [
        {
            url: "1 url",
            alt: "alt",
            _id: "1",
        },
        {
            url: "2 url",
            _id: "2",
            style: "style",
        },
    ];

    const connectedImages = connectImages(images);

    expect(Object.keys(connectedImages[0]).sort()).toEqual([
        "_id",
        "alt",
        "nextImg",
        "prevImg",
        "src",
    ]);
    expect(Object.keys(connectedImages[1]).sort()).toEqual([
        "_id",
        "nextImg",
        "prevImg",
        "src",
        "style",
    ]);
});
