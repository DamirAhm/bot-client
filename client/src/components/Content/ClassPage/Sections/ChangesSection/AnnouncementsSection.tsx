import React, { useContext, useEffect, useState } from 'react';
import styles from '../Common/ContentSection.module.css';
import InfoSection from '../../InfoSection/InfoSection';
import { gql } from 'apollo-boost';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { attachment, WithTypename, announcement, redactorOptions } from '../../../../../types';
import Suspender from '../../../../Common/Suspender/Suspender';
import Accordion from '../../../../Common/Accordion/Accordion';
import { GoTriangleRight } from 'react-icons/go';
import ReactDOM from 'react-dom';
import ChangeContent from '../../../../Common/ChangeContent/ChangeContent';
import ImgAlbum from '../../../../Common/OpenableImage/ImgAlbum';
import {
	parseContentByDate,
	getDateStrFromDayMonthStr,
	objectForEach,
} from '../../../../../utils/functions';
import Options from '../../../../Common/Options/Options';
import { UserContext } from '../../../../../App';
import { useParams } from 'react-router-dom';
import ContentElement from '../../../../Common/ContentElement';

const announcementContentModalRoot = document.getElementById('changeContentModal');

type announcementProps = {
	announcement: announcement;
	removeAnnouncement: (announcementId: string | undefined) => void;
	updateAnnouncement: (
		announcementId: string | undefined,
		updates: Partial<announcement>,
	) => void;
};

const GET_ANNOUNCEMENTS = gql`
	query GetAnnouncements($className: String!, $schoolName: String!) {
		announcements: getAnnouncements(className: $className, schoolName: $schoolName) {
			text
			createdBy
			to
			attachments {
				url
				value
				_id
			}
			_id
			__typename
		}
	}
`;

const REMOVE_ANNOUNCEMENT = gql`
	mutation RemoveAnnouncement(
		$className: String!
		$announcementId: String!
		$schoolName: String!
	) {
		removeAnnouncement(
			announcementId: $announcementId
			className: $className
			schoolName: $schoolName
		)
	}
`;

const UPDATE_ANNOUNCEMENT = gql`
	mutation UpdateAnnouncement(
		$className: String!
		$schoolName: String!
		$announcementId: String!
		$updates: ClassAnnouncementsInput!
	) {
		updateAnnouncement(
			className: $className
			announcementId: $announcementId
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
		}
	}
`;

const ADD_ANNOUNCEMENT = gql`
	mutation addAnnouncement(
		$className: String!
		$schoolName: String!
		$text: String!
		$to: String
		$attachments: [ClassHomeworkAttachmentsInput]!
		$student_id: Int!
	) {
		addAnnouncement(
			className: $className
			schoolName: $schoolName
			text: $text
			to: $to
			attachments: $attachments
			student_id: $student_id
		) {
			text
			_id
			to
			attachments {
				url
				value
			}
			__typename
		}
	}
`;

const REMOVE_OLD_ANNOUNCEMENTS = gql`
	mutation RemoveOldAnnouncements($className: String!, $schoolName: String!) {
		removeOldAnnouncements(className: $className, schoolName: $schoolName) {
			to
			text
			attachments {
				url
				value
				_id
			}
			createdBy
			_id
		}
	}
`;

const AnnouncementsSection: React.FC<{}> = ({}) => {
	const { className, schoolName } = useParams<{ className: string; schoolName: string }>();

	const [announcementCreating, setAnnouncementCreating] = useState(false);
	const [initContent, setInitContent] = useState({});
	const announcementsQuery = useQuery<
		{ announcements: announcement[] },
		{ schoolName: string; className: string }
	>(GET_ANNOUNCEMENTS, {
		variables: { className, schoolName },
	});
	const { uid } = useContext(UserContext);

	const [removeAnnouncement] = useMutation<
		WithTypename<{
			removeAnnouncement: string;
		}>,
		{
			className: string;
			schoolName: string;
			announcementId: string;
		}
	>(REMOVE_ANNOUNCEMENT);
	const [updateAnnouncement] = useMutation<
		WithTypename<{
			updateAnnouncement: WithTypename<Partial<announcement>>;
		}>,
		{
			className: string;
			schoolName: string;
			announcementId: string;
			updates: Partial<Omit<announcement, 'attachments'> & { attachments: attachment[] }>;
		}
	>(UPDATE_ANNOUNCEMENT);
	const [addAnnouncement] = useMutation<
		WithTypename<{
			addAnnouncement: WithTypename<announcement>;
		}>,
		{
			className: string;
			schoolName: string;
			text: string;
			attachments: attachment[];
			to: string;
			student_id: number;
		}
	>(ADD_ANNOUNCEMENT);
	const [removeOldAnnouncements] = useMutation<
		{ removeOldAnnouncements: announcement[] },
		{ className: string; schoolName: string }
	>(REMOVE_OLD_ANNOUNCEMENTS, {
		variables: { className, schoolName },
		optimisticResponse: {
			removeOldAnnouncements:
				announcementsQuery.data?.announcements?.filter(
					({ to }) => Date.now() - Date.parse(to) <= 24 * 60 * 60 * 1000,
				) || [],
		},
		update: (proxy, mutation) => {
			if (mutation && mutation.data?.removeOldAnnouncements) {
				proxy.writeQuery({
					query: GET_ANNOUNCEMENTS,
					variables: { className, schoolName },
					data: {
						announcements: mutation.data.removeOldAnnouncements,
					},
				});
			}
		},
	});

	const remove = (announcementId: string | undefined) => {
		if (announcementId) {
			removeAnnouncement({
				variables: { className, announcementId, schoolName },
				optimisticResponse: {
					__typename: 'Mutation',
					removeAnnouncement: announcementId,
				},
				update: (proxy, res) => {
					const data = proxy.readQuery<{ announcements: announcement[] }>({
						query: GET_ANNOUNCEMENTS,
						variables: { className, schoolName },
					});

					if (res?.data) {
						proxy.writeQuery({
							query: GET_ANNOUNCEMENTS,
							variables: { className, schoolName },
							data: {
								announcements:
									data?.announcements.filter(
										(chng) => chng._id !== announcementId,
									) || [],
							},
						});
					}
				},
			});
		}
	};
	const update = (
		announcementId: string | undefined,
		updates: Partial<WithTypename<announcement>>,
	) => {
		const { __typename, ...announcementWithoutTypename } = updates;

		if (announcementId) {
			updateAnnouncement({
				variables: {
					className,
					schoolName,
					announcementId,
					updates: {
						...announcementWithoutTypename,
						attachments: updates.attachments?.map(({ __typename, ...att }) => att),
					},
				},
				optimisticResponse: {
					__typename: 'Mutation',
					updateAnnouncement: {
						__typename: 'ClassAnnouncement',
						_id: announcementId,
						...announcementsQuery?.data?.announcements.find(
							(hw) => hw._id === announcementId,
						),
						...updates,
					},
				},
				update: (proxy, res) => {
					const data = proxy.readQuery<{ announcements: announcement[] }>({
						query: GET_ANNOUNCEMENTS,
						variables: { className, schoolName },
					});

					if (res?.data) {
						proxy.writeQuery({
							query: GET_ANNOUNCEMENTS,
							variables: { className, schoolName },
							data: {
								homework:
									data?.announcements.map((chng) =>
										chng._id === announcementId
											? res.data?.updateAnnouncement
											: chng,
									) || [],
							},
						});
					}
				},
			});
		}
	};
	const add = (announcementData: Omit<announcement, '_id'>) => {
		addAnnouncement({
			variables: {
				...announcementData,
				className,
				schoolName,
				attachments: announcementData?.attachments?.map(({ __typename, ...att }) => att),
				student_id: uid,
			},
			optimisticResponse: {
				__typename: 'Mutation',
				addAnnouncement: {
					...announcementData,
					_id: Date.now().toString(),
					__typename: 'ClassAnnouncement',
				},
			},
			refetchQueries: [
				{
					query: GET_ANNOUNCEMENTS,
					variables: { className, schoolName },
				},
			],
		});
	};

	return (
		<>
			<InfoSection
				name="Обьявления"
				Header={({ opened, onClick }) => (
					<div
						className={`${styles.sectionHeader} ${styles.contentHeader}`}
						onClick={onClick}
					>
						<div className={styles.title}>
							Обьявления
							<GoTriangleRight
								className={opened ? styles.triangle_opened : ''}
								size={15}
							/>
						</div>

						<Add
							onClick={(e) => {
								e.stopPropagation();
								setAnnouncementCreating(true);
							}}
						/>
					</div>
				)}
			>
				<Suspender query={announcementsQuery}>
					{({ announcements }: { announcements?: WithTypename<announcement>[] }) => {
						if (announcements) {
							const [oldAnnouncements, actualAnnouncements] = parseContentByDate(
								announcements,
							);

							return (
								<div className={styles.content}>
									{Object.keys(oldAnnouncements).length > 0 && (
										<Accordion
											initiallyOpened={false}
											Head={({ opened }) => (
												<div className={styles.oldContentHeader}>
													<p
														className={`${styles.date} ${styles.accordion}`}
													>
														Старые обьявления
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
															onClick: () => removeOldAnnouncements(),
														}}
													/>
												</div>
											)}
										>
											<div className={styles.offseted}>
												<AnnouncementLayout
													announcements={oldAnnouncements}
													initiallyOpened={false}
													setAnnouncementCreating={
														setAnnouncementCreating
													}
													setInitContent={setInitContent}
													update={update}
													remove={remove}
												/>
											</div>
										</Accordion>
									)}
									<AnnouncementLayout
										announcements={actualAnnouncements}
										setAnnouncementCreating={setAnnouncementCreating}
										setInitContent={setInitContent}
										update={update}
										remove={remove}
									/>
								</div>
							);
						} else {
							return null;
						}
					}}
				</Suspender>
			</InfoSection>
			{announcementContentModalRoot &&
				announcementCreating &&
				ReactDOM.createPortal(
					<CreateAnnouncementModal
						returnAnnouncement={add}
						close={() => setAnnouncementCreating(false)}
						initContent={initContent}
					/>,
					announcementContentModalRoot,
				)}
		</>
	);
};

const AnnouncementLayout: React.FC<{
	announcements: {
		[day: string]: announcement[];
	};
	initiallyOpened?: boolean;
	setAnnouncementCreating: (state: boolean) => void;
	setInitContent: (initContent: Partial<announcement>) => void;
	update: (homeworkId: string | undefined, updates: Partial<announcement>) => void;
	remove: (homeworkId: string | undefined) => void;
}> = React.memo(
	({
		announcements,
		remove,
		update,
		setAnnouncementCreating,
		setInitContent,
		initiallyOpened = true,
	}) => {
		const [changingId, setChangingId] = useState<string | null>(null);
		const changingAnnouncement = changingId ? findAnnouncementById(changingId) : null;

		useEffect(() => {
			if (changingAnnouncement === null && changingId !== null) {
				setChangingId(null);
			}
		});

		function findAnnouncementById(id: string) {
			const announcementsArray = Object.values(announcements).flat();

			return announcementsArray.find(({ _id }) => _id === id) || null;
		}

		return (
			<>
				{Object.keys(announcements).map((announcementDate) => (
					<Accordion
						initiallyOpened={initiallyOpened}
						key={announcementDate}
						Head={({ opened }) => (
							<div className={styles.sectionHeader}>
								<div className={styles.title}>
									{announcementDate}
									<GoTriangleRight
										className={opened ? styles.triangle_opened : ''}
										size={15}
									/>
								</div>
								<Add
									onClick={(e) => {
										e.stopPropagation();
										setAnnouncementCreating(true);
										setInitContent({
											to: getDateStrFromDayMonthStr(announcementDate),
										});
									}}
								/>
							</div>
						)}
					>
						<>
							<div className={`${styles.elements} ${styles.offseted}`}>
								{announcements[announcementDate].map((announcement, i) => (
									<ContentElement
										setChanging={setChangingId}
										key={announcement._id}
										removeContent={remove}
										content={announcement}
									/>
								))}
							</div>
						</>
					</Accordion>
				))}

				{changingId &&
					changingId !== null &&
					changingAnnouncement !== null &&
					announcementContentModalRoot &&
					ReactDOM.createPortal(
						<div className="modal" onMouseDown={() => setChangingId(null)}>
							<ChangeContent
								initState={changingAnnouncement}
								confirm={(newContent) => {
									update(changingAnnouncement._id, newContent);
									setChangingId(null);
								}}
								reject={() => setChangingId(null)}
							/>
						</div>,
						announcementContentModalRoot,
					)}
			</>
		);
	},
);

type CreateAnnouncementModalProps = {
	initContent?: Partial<announcement>;
	returnAnnouncement: (hw: Omit<announcement, '_id'>) => void;
	close: () => void;
};
const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
	returnAnnouncement,
	close,
	initContent = {},
}) => {
	if (announcementContentModalRoot) {
		return ReactDOM.createPortal(
			<div className={'modal'} onMouseDown={close}>
				<ChangeContent
					initState={initContent}
					confirm={(content) => {
						returnAnnouncement(content);
						close();
					}}
					reject={close}
				/>
			</div>,
			announcementContentModalRoot,
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

export default AnnouncementsSection;
