import React, { CSSProperties, ChangeEvent } from 'react'
type Props = {
    View: React.FC<{}>,
    style?: CSSProperties,
    onChange: (e: ChangeEvent<HTMLInputElement>) => void
}

const FileUploader: React.FC<Props> = ({ View, style, onChange }) => {
    return (
        <label style={style || {}}>
            <View />
            <input
                type="file"
                onChange={(e) => (onChange(e), e.target.value = "")} multiple
                style={{ outline: 0, opacity: 0, pointerEvents: "none", userSelect: "none", display: "none" }} />
        </label>
    )
}

export default FileUploader