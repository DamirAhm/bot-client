import React, { MouseEvent, useState } from "react";
import styles from "./ClassPreview.module.css";
import { gql } from "@apollo/client";
import { useMutation } from "@apollo/client";
import { GET_CLASSES, classPreview } from "../Classes";
import { redactorOptions, WithTypename } from "../../../../types";
import Options from "../../../Common/Options/Options";

export const CREATE_CLASS = gql`
	mutation CreateClass($className: String!, $schoolName: String!) {
		classCreateOne(className: $className, schoolName: $schoolName) {
			name
			schoolName
			studentsCount
			_id
			__typename
		}
	}
`;

const ClassCreator: React.FC<{ schoolName: string }> = ({ schoolName }) => {
	const [creating, setCreating] = useState<boolean>(false);
	const [name, setName] = useState("");
	const [error, setError] = useState<string | null>(null);

	const [createClass] = useMutation<
		{ classCreateOne: classPreview },
		{ className: string; schoolName: string }
	>(CREATE_CLASS, {
		variables: {
			className: name.toUpperCase().replace(/\s/g, ""),
			schoolName,
		},
		optimisticResponse: {
			classCreateOne: {
				name,
				studentsCount: 0,
				schoolName,
				_id: new Date().toISOString(),
			},
		},
		update: (proxy, data) => {
			if (data.data) {
				const classesQuery = proxy.readQuery<
					{ classes: classPreview[] },
					{ schoolName: string }
				>({
					query: GET_CLASSES,
					variables: { schoolName },
				});

				if (classesQuery) {
					const { classes } = classesQuery;
					const newClasses = [...classes, data.data?.classCreateOne];

					proxy.writeQuery<{ classes: classPreview[] }, { schoolName: string }>(
						{
							query: GET_CLASSES,
							variables: { schoolName },
							data: {
								classes: newClasses,
							},
						}
					);
				}
			}
		},
	});

	const clear = (e: MouseEvent) => {
		e.stopPropagation();
		setCreating(false);
		setName("");
		setError(null);
	};

	const confirm = (e: React.FormEvent) => {
		e.preventDefault();
		if (matchClassName(name)) {
			createClass();
			setCreating(false);
			setName("");
			setError(null);
		} else {
			setName("");
			setError("Неверное имя класса");
		}
	};

	return (
		<div className={styles.wrapper}>
			<div
				className={`${styles.creator} ${!creating ? styles.creator_stab : ""} ${
					styles.preview
				}`}
				onClick={() => setCreating(true)}
			>
				{creating ? (
					<form onSubmit={confirm} className={styles.form}>
						<Options
							include={redactorOptions.reject}
							size={20}
							onClick={clear}
							className={`reject ${styles.button}`}
						/>
						<input
							onChange={e => setName(e.target.value)}
							value={name}
							autoFocus={true}
							type="text"
							placeholder={error ?? "Имя класса в формате цифра буква"}
							className={`${error ? styles.with_error : ""} ${styles.input}`}
						/>
						<Options
							include={redactorOptions.confirm}
							size={20}
							onClick={confirm}
							className={`confirm ${styles.button}`}
						/>
					</form>
				) : (
					"Создать класс"
				)}
			</div>
		</div>
	);
};

const matchClassName = (name: string): readonly [number, string] | null => {
	if (/([0-9]{1,2})\s*([A-Z]|[А-Я]){1}/i.test(name)) {
		const res = name.match(/([0-9]{1,2})\s*([A-Z]|[А-Я]){1}/i);

		if (res !== null) {
			const [, digit, letter] = res;

			if (+digit > 0 && +digit <= 12) {
				return [+digit, letter] as const;
			}
		}
	}

	return null;
};

export default ClassCreator;
