import React, { useState, StyleHTMLAttributes } from 'react'
import { MdClose } from "react-icons/md"
type Props = {
    changeHandler: (str: string) => void,
    text?: string
}

const divStyle: React.CSSProperties = {
    position: "relative"
}

const closeStyle: React.CSSProperties = {
    position: "absolute",
    color: "var(--main)",
    right: "0.5rem",
    top: "calc(50% - 15px/2)",
}

const inputStyle: React.CSSProperties = {
    borderRadius: "10px",
    height: "100%",
    color: "var(--main)",
    paddingLeft: "5px",
    boxSizing: "border-box"
}

const Searcher: React.FC<Props> = ({ changeHandler }) => {
    const [text, setText] = useState("");

    return (
        <div style={divStyle} onClick={e => e.stopPropagation()}>
            <input style={inputStyle} type="text" value={text} onChange={e => (setText(e.target.value), changeHandler(e.target.value))} />
            <MdClose onClick={() => (setText(""), changeHandler(""))} style={closeStyle} className={"negative"} size={15} />
        </div>
    )
}

export default Searcher