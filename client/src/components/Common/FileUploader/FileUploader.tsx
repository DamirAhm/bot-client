import React, { CSSProperties, ChangeEvent } from 'react';
type Props = {
	View?: JSX.Element;
	style?: CSSProperties;
	onChange: (e: ChangeEvent<HTMLInputElement>) => void;
};

const FileUploader: React.FC<Props> = ({ View, style, onChange }) => {
	return (
		//TODO fix using user views (Сейчас при нажатии на иконку ничего не происходит)
		<label style={style || {}}>
			{/* {View} */}
			<input
				type="file"
				onChange={(e) => {
					onChange(e);
					e.target.value = '';
				}}
				multiple
				data-testid="input"
				// style={{
				// 	outline: 0,
				// 	opacity: 0,
				// 	pointerEvents: 'none',
				// 	userSelect: 'none',
				// 	display: 'none',
				// }}
			/>
		</label>
	);
};

export default FileUploader;
