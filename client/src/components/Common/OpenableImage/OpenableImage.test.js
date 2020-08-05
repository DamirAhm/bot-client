import React from "react";
import { render } from "@testing-library/react";
import OpenableImg, { ImgStab } from "./OpenableImage";
import {
    queryByAltText,
    screen,
    queryByTestId,
    fireEvent,
} from "@testing-library/dom";
import { connectImages } from "./ImgAlbum";

test("renders image with given src", () => {
    const { queryByAltText } = render(
        <OpenableImg src={"fake url"} alt={"Alt to find"} />
    );

    const image = queryByAltText("Alt to find");

    expect(image).not.toBeNull();
    expect(image.getAttribute("src")).toBe("fake url");
});

test("opens modal on click on photo", () => {
    const photoModal = document.createElement("div");
    photoModal.id = "photoModal";
    document.body.appendChild(photoModal);

    const { getByAltText } = render(
        <OpenableImg src={"fake url"} alt={"Alt to find"} />
    );
    const photo = getByAltText("Alt to find");
    photo.click();

    const modalPhoto = queryByAltText(photoModal, "Alt to find");

    expect(modalPhoto).not.toBeNull();
    expect(modalPhoto.getAttribute("src")).toBe("fake url");

    photoModal.remove();
});
test("does not render modal if photoModal div is not exists", () => {
    const { getByAltText } = render(
        <OpenableImg src={"fake url"} alt={"Alt to find"} />
    );
    const photo = getByAltText("Alt to find");
    photo.click();

    const photos = screen.queryAllByAltText("Alt to find");

    //Just original photo element
    expect(photos.length).toBe(1);
});

test("does not renders chevrons if prev/nextImg are not given", () => {
    const photoModal = document.createElement("div");
    photoModal.id = "photoModal";
    document.body.appendChild(photoModal);

    const { getByAltText } = render(
        <OpenableImg src={"fake url"} alt={"Alt to find"} />
    );
    const photo = getByAltText("Alt to find");
    photo.click();

    const prevImgChevron = queryByTestId(photoModal, "prevImg");
    const nextImgChevron = queryByTestId(photoModal, "nextImg");

    expect(prevImgChevron).toBeNull();
    expect(nextImgChevron).toBeNull();

    photoModal.remove();
});
test("renders chevrons if prev/nextImg are given", () => {
    const photoModal = document.createElement("div");
    photoModal.id = "photoModal";
    document.body.appendChild(photoModal);

    let openablePhoto = render(
        <OpenableImg
            src={"fake url"}
            alt={"Alt to find"}
            prevImg={{ src: "prev url" }}
        />
    );
    let photo = openablePhoto.getByAltText("Alt to find");
    photo.click();

    let prevImgChevron = queryByTestId(photoModal, "prevImg");
    let nextImgChevron = queryByTestId(photoModal, "nextImg");

    //only prevImg is given
    expect(prevImgChevron).not.toBeNull();
    expect(nextImgChevron).toBeNull();

    openablePhoto.unmount();

    openablePhoto = render(
        <OpenableImg
            src={"fake url"}
            alt={"Alt to find"}
            nextImg={{ src: "next url" }}
        />
    );
    photo = openablePhoto.getByAltText("Alt to find");
    photo.click();

    prevImgChevron = queryByTestId(photoModal, "prevImg");
    nextImgChevron = queryByTestId(photoModal, "nextImg");

    //only nextImg is given
    expect(prevImgChevron).toBeNull();
    expect(nextImgChevron).not.toBeNull();

    openablePhoto.unmount();

    openablePhoto = render(
        <OpenableImg
            src={"fake url"}
            alt={"Alt to find"}
            nextImg={{ src: "next url" }}
            prevImg={{ src: "prev url" }}
        />
    );
    photo = openablePhoto.getByAltText("Alt to find");
    photo.click();

    prevImgChevron = queryByTestId(photoModal, "prevImg");
    nextImgChevron = queryByTestId(photoModal, "nextImg");

    //both nextImg and prevImg are given
    expect(prevImgChevron).not.toBeNull();
    expect(nextImgChevron).not.toBeNull();

    openablePhoto.unmount();

    photoModal.remove();
});
test("change photo src on click on chevron", () => {
    const photoModal = document.createElement("div");
    photoModal.id = "photoModal";
    document.body.appendChild(photoModal);

    const images = connectImages([
        { url: "prev url" },
        { url: "fake url" },
        { url: "next url" },
    ]);

    let openablePhoto = render(
        <OpenableImg
            src={"fake url"}
            alt={"Alt to find"}
            prevImg={images[0]}
            nextImg={images[2]}
        />
    );
    let photo = openablePhoto.getByAltText("Alt to find");
    photo.click();

    let prevImgChevron = queryByTestId(photoModal, "prevImg");
    let nextImgChevron = queryByTestId(photoModal, "nextImg");

    fireEvent(prevImgChevron, new MouseEvent("mousedown", { bubbles: true }));

    let modalPhoto = queryByAltText(photoModal, "Alt to find");

    expect(modalPhoto).not.toBeNull();
    expect(modalPhoto.getAttribute("src")).toBe("prev url");

    fireEvent(nextImgChevron, new MouseEvent("mousedown", { bubbles: true }));

    expect(modalPhoto).not.toBeNull();
    expect(modalPhoto.getAttribute("src")).toBe("fake url");

    fireEvent(nextImgChevron, new MouseEvent("mousedown", { bubbles: true }));

    expect(modalPhoto).not.toBeNull();
    expect(modalPhoto.getAttribute("src")).toBe("next url");

    photoModal.remove();
});

test("stab places given element instead of image", () => {
    const imageStab = render(
        <ImgStab
            Stab={({ onClick }) => <div onClick={onClick}>stab</div>}
            src={"fake url"}
        />
    );

    expect(imageStab.queryByText("stab")).not.toBeNull();
});
test("opens modal on click on stab", () => {
    const photoModal = document.createElement("div");
    photoModal.id = "photoModal";
    document.body.appendChild(photoModal);

    const imageStab = render(
        <ImgStab
            Stab={({ onClick }) => <div onClick={onClick}>stab</div>}
            src={"fake url"}
            alt={"Alt to find"}
        />
    );

    const stab = imageStab.queryByText("stab");

    stab.click();
    const modalPhoto = queryByAltText(photoModal, "Alt to find");

    expect(modalPhoto).not.toBeNull();
    expect(modalPhoto.getAttribute("src")).toBe("fake url");

    photoModal.remove();
});
