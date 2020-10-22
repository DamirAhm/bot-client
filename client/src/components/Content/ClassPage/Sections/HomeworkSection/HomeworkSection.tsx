import React, { useContext, useEffect, useState } from 'react';
import styles from '../Common/ContentSection.module.css';
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { attachment, WithTypename, homework, redactorOptions } from '../../../../../types';
import Suspender from '../../../../Common/Suspender/Suspender';
import Accordion from '../../../../Common/Accordion/Accordion';
import { GoTriangleRight } from 'react-icons/go';
import ReactDOM from 'react-dom';
import ImgAlbum from '../../../../Common/OpenableImage/ImgAlbum';
import {
	parseContentByDate,
	objectForEach,
	getDateStrFromDayMonthStr,
} from '../../../../../utils/functions';
import Options from '../../../../Common/Options/Options';
import ChangeHomework from '../../../../Common/ChangeContent/ChangeHomework';
import { UserContext } from '../../../../../App';
import { useParams } from 'react-router-dom';
import ContentElement from '../../../../Common/ContentElement';

const changeContentModalRoot = document.getElementById('changeContentModal');

type taskProps = {
	homework: homework;
	removeHomework: (homeworkId: string | undefined) => void;
	updateHomework: (homeworkId: string | undefined, updates: Partial<homework>) => void;
};

const GET_HOMEWORK = gql`
	query GetHomework($className: String!, $schoolName: String!) {
		homework: getHomework(className: $className, schoolName: $schoolName) {
			text
			createdBy
			to
			attachments {
				url
				value
				_id
			}
			lesson
			_id
			__typename
		}
	}
`;

const REMOVE_TASK = gql`
	mutation RemoveTask($className: String!, $homeworkId: String!, $schoolName: String!) {
		removeHomework(homeworkId: $homeworkId, className: $className, schoolName: $schoolName)
	}
`;

const CHANGE_HOMEWORK = gql`
	mutation ChangeHomework(
		$className: String!
		$homeworkId: String!
		$updates: ClassHomeworkInput!
		$schoolName: String!
	) {
		updateHomework(
			className: $className
			homeworkId: $homeworkId
			updates: $updates
			schoolName: $schoolName
		) {
			_id
			text
			attachments {
				url
				value
				_id
			}
			to
			lesson
			__typename
		}
	}
`;

const ADD_HOMEWORK = gql`
	mutation addHomework(
		$schoolName: String!
		$className: String!
		$text: String!
		$to: String
		$lesson: String!
		$attachments: [ClassHomeworkAttachmentsInput]!
		$student_id: Int!
	) {
		addHomework(
			className: $className
			text: $text
			to: $to
			lesson: $lesson
			attachments: $attachments
			student_id: $student_id
			schoolName: $schoolName
		) {
			_id
			text
			lesson
			to
			attachments {
				url
				value
			}
			__typename
		}
	}
`;

const REMOVE_OLD_HOMEWORK = gql`
	mutation RemoveOldHomework($className: String!, $schoolName: String!) {
		removeOldHomework(className: $className, schoolName: $schoolName) {
			_id
			to
			text
			attachments {
				url
				value
				_id
			}
			lesson
			createdBy
			__typename
		}
	}
`;

const HomeworkSection: React.FC<{}> = ({}) => {
	const { schoolName, className } = useParams<{ schoolName: string; className: string }>();

	const [homeworkCreating, setHomeworkCreating] = useState(false);
	const [initContent, setInitContent] = useState({});
	const homeworkQuery = useQuery<
		{ homework: homework[] },
		{ className: string; schoolName: string }
	>(GET_HOMEWORK, {
		variables: { className, schoolName },
	});
	const { uid } = useContext(UserContext);

	const [removeHomework] = useMutation<
		WithTypename<{
			removeHomework: string;
		}>,
		{
			className: string;
			homeworkId: string;
			schoolName: string;
		}
	>(REMOVE_TASK);
	const [updateHomework] = useMutation<
		WithTypename<{
			updateHomework: WithTypename<Partial<homework>>;
		}>,
		{
			className: string;
			schoolName: string;
			homeworkId: string;
			updates: Partial<Omit<homework, 'attachments'> & { attachments: attachment[] }>;
		}
	>(CHANGE_HOMEWORK);

	const [addHomework] = useMutation<
		WithTypename<{
			addHomework: WithTypename<homework>;
		}>,
		{
			className: string;
			schoolName: string;
			text: string;
			lesson: string;
			attachments: attachment[];
			to: string;
			student_id: number;
		}
	>(ADD_HOMEWORK);
	const [removeOldHomework] = useMutation<
		{ removeOldHomework: homework[] },
		{ className: string; schoolName: string }
	>(REMOVE_OLD_HOMEWORK, {
		variables: { className, schoolName },
		optimisticResponse: {
			removeOldHomework:
				homeworkQuery.data?.homework.filter(
					({ to }) => Date.now() - Date.parse(to) <= 24 * 60 * 60 * 1000,
				) || [],
		},
		update: (proxy, mutation) => {
			if (mutation && mutation.data?.removeOldHomework) {
				proxy.writeQuery({
					query: GET_HOMEWORK,
					variables: { className, schoolName },
					data: {
						homework: mutation.data.removeOldHomework,
					},
				});
			}
		},
	});

	const remove = (homeworkId: string | undefined) => {
		if (homeworkId) {
			removeHomework({
				variables: { className, homeworkId, schoolName },
				optimisticResponse: {
					__typename: 'Mutation',
					removeHomework: homeworkId,
				},
				update: (proxy, res) => {
					const data = proxy.readQuery<{ homework: homework[] }>({
						query: GET_HOMEWORK,
						variables: { className, schoolName },
					});

					if (res?.data) {
						proxy.writeQuery({
							query: GET_HOMEWORK,
							variables: { className, schoolName },
							data: {
								homework:
									data?.homework.filter((hw) => hw._id !== homeworkId) || [],
							},
						});
					}
				},
			});
		}
	};
	const update = (homeworkId: string | undefined, updates: Partial<WithTypename<homework>>) => {
		const { __typename, ...updatesWithoutTypename } = updates;

		if (homeworkId) {
			updateHomework({
				variables: {
					className,
					schoolName,
					homeworkId,
					updates: {
						...updatesWithoutTypename,
						attachments: updates.attachments?.map(({ __typename, ...att }) => att),
					},
				},
				optimisticResponse: {
					__typename: 'Mutation',
					updateHomework: {
						__typename: 'ClassHomework',
						_id: homeworkId,
						...homeworkQuery?.data?.homework.find((hw) => hw._id === homeworkId),
						...updates,
					},
				},
				update: (proxy, res) => {
					const data = proxy.readQuery<{ homework: homework[] }>({
						query: GET_HOMEWORK,
						variables: { className, schoolName },
					});

					if (res?.data) {
						proxy.writeQuery({
							query: GET_HOMEWORK,
							variables: { className, schoolName },
							data: {
								homework:
									data?.homework.map((hw) =>
										hw._id === homeworkId ? res.data?.updateHomework : hw,
									) || [],
							},
						});
					}
				},
			});
		}
	};
	const add = (homeworkData: Omit<homework, '_id'>) => {
		addHomework({
			variables: {
				...homeworkData,
				className,
				schoolName,
				attachments: homeworkData.attachments.map(({ __typename, ...att }) => att),
				student_id: uid,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				addHomework: {
					...homeworkData,
					_id: Date.now().toString(),
					__typename: 'ClassHomework',
				},
			},
			refetchQueries: [
				{
					query: GET_HOMEWORK,
					variables: { className, schoolName },
				},
			],
		});
		setInitContent({});
	};
	console.log(!!(homeworkQuery?.data?.homework && homeworkQuery?.data?.homework.length > 0));
	return (
		<>
			<InfoSection
				isOpened={
					!!(homeworkQuery?.data?.homework && homeworkQuery?.data?.homework.length > 0)
				}
				name="Домашняя работа"
				Header={({ opened, onClick }) => (
					<div
						className={`${styles.sectionHeader} ${styles.contentHeader}`}
						onClick={onClick}
					>
						<div className={styles.title}>
							Домашняя работа
							<GoTriangleRight
								className={opened ? styles.triangle_opened : ''}
								size={15}
							/>
						</div>
						<Add
							onClick={(e) => {
								e.stopPropagation();
								setHomeworkCreating(true);
							}}
						/>
					</div>
				)}
			>
				<Suspender query={homeworkQuery}>
					{(data: { homework: homework[] }) => {
						const [oldHw, newHw] = parseContentByDate(data.homework);
						return (
							<div className={styles.content}>
								{Object.keys(oldHw).length > 0 && (
									<Accordion
										initiallyOpened={false}
										Head={({ opened }) => (
											<div className={styles.oldContentHeader}>
												<p className={`${styles.date} ${styles.accordion}`}>
													Старое дз
													<GoTriangleRight
														size={15}
														className={
															opened ? styles.triangle_opened : ''
														}
													/>
												</p>

												<Options
													include={redactorOptions.delete}
													props={{
														allowOnlyRedactor: true,
														className: `remove ${styles.removeOldContent}`,
														size: 20,
														onClick: () => removeOldHomework(),
													}}
												/>
											</div>
										)}
									>
										<div className={styles.offseted}>
											<HomeworkLayout
												homework={oldHw}
												initiallyOpened={false}
												setHomeworkCreating={setHomeworkCreating}
												setInitContent={setInitContent}
												update={update}
												remove={remove}
											/>
										</div>
									</Accordion>
								)}
								<HomeworkLayout
									homework={newHw}
									setHomeworkCreating={setHomeworkCreating}
									setInitContent={setInitContent}
									update={update}
									remove={remove}
								/>
							</div>
						);
					}}
				</Suspender>
			</InfoSection>
			{changeContentModalRoot &&
				homeworkCreating &&
				ReactDOM.createPortal(
					<CreateHomeworkModal
						returnHomework={add}
						close={() => {
							setHomeworkCreating(false);
							setInitContent({});
						}}
						initContent={initContent}
					/>,
					changeContentModalRoot,
				)}
		</>
	);
};

const HomeworkLayout: React.FC<{
	homework: {
		[day: string]: homework[];
	};
	initiallyOpened?: boolean;
	setHomeworkCreating: (state: boolean) => void;
	setInitContent: (initContent: Partial<homework>) => void;
	update: (homeworkId: string | undefined, updates: Partial<homework>) => void;
	remove: (homeworkId: string | undefined) => void;
}> = React.memo(
	({ homework, remove, update, setHomeworkCreating, setInitContent, initiallyOpened = true }) => {
		const [changingId, setChangingId] = useState<string | null>(null);
		const changingHomework = changingId ? findHomeworkById(changingId) : null;

		useEffect(() => {
			if (changingHomework === null && changingId !== null) {
				setChangingId(null);
			}
		}, [changingHomework]);

		function findHomeworkById(id: string) {
			const homeworkArray = Object.values(homework).flat();

			return homeworkArray.find((homework) => homework._id === id) || null;
		}

		const parsedHomework = objectForEach(homework, parseHomeworkByLesson);

		return (
			<>
				{Object.keys(parsedHomework).map((hwDate) => (
					<Accordion
						key={hwDate}
						initiallyOpened={initiallyOpened}
						Head={({ opened }) => (
							<div className={styles.sectionHeader}>
								<div className={`${styles.date} ${styles.accordion}`}>
									{hwDate}
									<GoTriangleRight
										className={opened ? styles.triangle_opened : ''}
										size={15}
									/>
								</div>
								<Add
									onClick={(e) => {
										e.stopPropagation();
										setHomeworkCreating(true);
										setInitContent({ to: getDateStrFromDayMonthStr(hwDate) });
									}}
								/>
							</div>
						)}
					>
						<>
							{Object.keys(parsedHomework[hwDate]).map((lesson) => (
								<Accordion
									className={styles.offseted}
									key={hwDate + lesson}
									Head={({ opened }) => (
										<div className={styles.sectionHeader}>
											<div className={`${styles.lesson} ${styles.accordion}`}>
												{lesson}
												<GoTriangleRight
													className={opened ? styles.triangle_opened : ''}
													size={15}
												/>
											</div>
											<Add
												onClick={(e) => {
													e.stopPropagation();
													setHomeworkCreating(true);
													setInitContent({
														to: getDateStrFromDayMonthStr(hwDate),
														lesson,
													});
												}}
											/>
										</div>
									)}
								>
									<div className={`${styles.elements} ${styles.offseted}`}>
										{parsedHomework[hwDate][lesson].map((hw, i) => (
											<ContentElement
												setChanging={setChangingId}
												key={hw._id}
												removeContent={remove}
												content={hw}
											/>
										))}
									</div>
								</Accordion>
							))}

							{changingId &&
								changingId !== null &&
								changingHomework !== null &&
								changeContentModalRoot &&
								ReactDOM.createPortal(
									<div className="modal" onMouseDown={() => setChangingId(null)}>
										<ChangeHomework
											initState={changingHomework}
											confirm={(newContent) => {
												update(changingHomework._id, newContent);
												setChangingId(null);
											}}
											reject={() => setChangingId(null)}
										/>
									</div>,
									changeContentModalRoot,
								)}
						</>
					</Accordion>
				))}
			</>
		);
	},
);

type CreateHomeworkModalProps = {
	returnHomework: (hw: Omit<homework, '_id'>) => void;
	close: () => void;
	initContent?: Partial<homework>;
};
const CreateHomeworkModal: React.FC<CreateHomeworkModalProps> = ({
	returnHomework,
	close,
	initContent = {},
}) => {
	if (changeContentModalRoot) {
		return ReactDOM.createPortal(
			<div className={'modal'} onMouseDown={close}>
				<ChangeHomework
					initState={initContent}
					confirm={(homework) => {
						returnHomework(homework);
						close();
					}}
					reject={close}
				/>
			</div>,
			changeContentModalRoot,
		);
	}
	return null;
};

const Add: React.FC<{ onClick: (e: React.MouseEvent<SVGElement, MouseEvent>) => void }> = ({
	onClick,
}) => {
	return (
		<Options
			include={redactorOptions.add}
			props={{
				className: styles.addContent,
				size: 30,
				onClick,
				allowOnlyRedactor: true,
			}}
		/>
	);
};

const parseHomeworkByLesson = (homework: homework[]): { [lesson: string]: homework[] } => {
	const parsedHomework = {} as { [lesson: string]: homework[] } & object;

	for (let hw of homework) {
		const lesson = hw.lesson;
		if (parsedHomework.hasOwnProperty(lesson)) {
			parsedHomework[lesson].push(hw);
		} else {
			parsedHomework[lesson] = [hw];
		}
	}

	return parsedHomework;
};

export default HomeworkSection;
