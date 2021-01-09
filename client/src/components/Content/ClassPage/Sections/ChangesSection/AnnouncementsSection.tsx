import styles from '../Common/ContentSection.module.css';

import { attachment, WithTypename, announcement, redactorOptions } from '../../../../../types';

import React, { useContext, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { gql, useSubscription } from '@apollo/client';
import { useQuery, useMutation } from '@apollo/client';
import { GoTriangleRight } from 'react-icons/go';
import { useParams } from 'react-router-dom';

import {
	parseContentByDate,
	getDateStrFromDayMonthStr,
	concatObjects,
	getPinnedContent,
} from '../../../../../utils/functions';

import Accordion from '../../../../Common/Accordion/Accordion';
import Suspender from '../../../../Common/Suspender/Suspender';
import ChangeContent from '../../../../Common/ChangeContent/ChangeContent';
import Options from '../../../../Common/Options/Options';
import InfoSection from '../../InfoSection/InfoSection';
import ContentElement from '../../../../Common/ContentElement';

import { UserContext } from '../../../../../App';
import usePolling from '../../../../../hooks/usePolling';
import useUnmount from '../../../../../hooks/useUnmount';

const announcementContentModalRoot = document.getElementById('changeContentModal');

const Queries = {
	GET_ANNOUNCEMENTS: gql`
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
	`,
};
const Mutations = {
	ADD_ANNOUNCEMENT: gql`
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
	`,
	REMOVE_ANNOUNCEMENT: gql`
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
	`,
	UPDATE_ANNOUNCEMENT: gql`
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
	`,
	REMOVE_OLD_ANNOUNCEMENTS: gql`
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
	`,
	TOGGLE_PIN_ANNOUNCEMENT: gql`
		mutation TogglePinAnnouncements(
			$className: String!
			$schoolName: String!
			$announcementId: String!
		) {
			pinAnnouncement(
				className: $className
				schoolName: $schoolName
				announcementId: $announcementId
			) {
				_id
				pinned
			}
		}
	`,
	UNPIN_ALL_ANNOUNCEMENTS: gql`
		mutation UnpinAllHomework($className: String!, $schoolName: String!) {
			unpinAllAnnouncements(className: $className, schoolName: $schoolName)
		}
	`,
};
const Subscriptions = {
	ON_ANNOUNCEMENT_ADDED: gql`
		subscription OnAnnouncementAdded($className: String!, $schoolName: String!) {
			onAnnouncementAdded(className: $className, schoolName: $schoolName) {
				_id
				text
				attachments {
					url
					value
					_id
				}
				to
				pinned
				__typename
			}
		}
	`,
	ON_ANNOUNCEMENT_CONFIRMED: gql`
		subscription OnAnnouncementConfirmed($className: String!, $schoolName: String!) {
			onAnnouncementConfirmed(className: $className, schoolName: $schoolName) {
				stabId
				actualId
			}
		}
	`,
	ON_ANNOUNCEMENTS_REMOVED: gql`
		subscription OnAnnouncementsRemoved($className: String!, $schoolName: String!) {
			onAnnouncementsRemoved(className: $className, schoolName: $schoolName)
		}
	`,
	ON_ANNOUNCEMENT_CHANGED: gql`
		subscription OnAnnouncementChanged($className: String!, $schoolName: String!) {
			onAnnouncementChanged(className: $className, schoolName: $schoolName) {
				_id
				text
				attachments {
					url
					value
					_id
				}
				to
				pinned
				__typename
			}
		}
	`,
};

const AnnouncementsSection: React.FC<{}> = ({}) => {
	const { className, schoolName } = useParams<{ className: string; schoolName: string }>();
	const { uid } = useContext(UserContext);
	const [announcementCreating, setAnnouncementCreating] = useState(false);
	const [initContent, setInitContent] = useState({});

	const announcementsQuery = useQuery<
		{ announcements: announcement[] },
		{ schoolName: string; className: string }
	>(Queries.GET_ANNOUNCEMENTS, {
		variables: { className, schoolName },
	});
	useSubscription<{ onAnnouncementAdded: announcement | null }>(
		Subscriptions.ON_ANNOUNCEMENT_ADDED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const newAnnouncement = subscriptionData.data?.onAnnouncementAdded;
				if (newAnnouncement) {
					announcementsQuery.updateQuery((prev) => {
						return {
							announcements: prev.announcements.concat([newAnnouncement]),
						};
					});
				}
			},
		},
	);
	useSubscription<{ onAnnouncementConfirmed: { stabId: string; actualId: string } | null }>(
		Subscriptions.ON_ANNOUNCEMENT_CONFIRMED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const confirmation = subscriptionData.data?.onAnnouncementConfirmed;

				if (confirmation) {
					announcementsQuery.updateQuery((prev) => {
						return {
							announcements: prev.announcements.map(({ _id, ...announcement }) =>
								_id === confirmation.stabId
									? { _id: confirmation.actualId, ...announcement }
									: { _id, ...announcement },
							),
						};
					});
				}
			},
		},
	);
	useSubscription<{ onAnnouncementsRemoved: string[] | null }>(
		Subscriptions.ON_ANNOUNCEMENTS_REMOVED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const removedAnnouncementsIds = subscriptionData.data?.onAnnouncementsRemoved;

				if (removedAnnouncementsIds) {
					announcementsQuery.updateQuery((prev) => {
						return {
							announcements: prev.announcements.filter(
								({ _id }) => !removedAnnouncementsIds.includes(_id as string),
							),
						};
					});
				}
			},
		},
	);
	useSubscription<{ onAnnouncementChanged: Partial<announcement> | null }>(
		Subscriptions.ON_ANNOUNCEMENT_CHANGED,
		{
			variables: { className, schoolName },
			onSubscriptionData: ({ subscriptionData }) => {
				const updates = subscriptionData.data?.onAnnouncementChanged;

				if (updates) {
					announcementsQuery.updateQuery((prev) => {
						return {
							announcements: prev.announcements.map(({ _id, ...announcement }) =>
								_id === updates._id
									? { ...announcement, ...updates }
									: { ...announcement, _id },
							),
						};
					});
				}
			},
		},
	);

	const [removeOldAnnouncements] = useMutation<
		{ removeOldAnnouncements: announcement[] },
		{ className: string; schoolName: string }
	>(Mutations.REMOVE_OLD_ANNOUNCEMENTS, {
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
					query: Queries.GET_ANNOUNCEMENTS,
					variables: { className, schoolName },
					data: {
						announcements: mutation.data.removeOldAnnouncements,
					},
				});
			}
		},
	});

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
	>(Mutations.ADD_ANNOUNCEMENT);
	const add = (announcementData: Pick<announcement, 'text' | 'attachments' | 'to'>) => {
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
					pinned: false,
					_id: Date.now().toString(),
					__typename: 'ClassAnnouncement',
				},
			},
			refetchQueries: [
				{
					query: Queries.GET_ANNOUNCEMENTS,
					variables: { className, schoolName },
				},
			],
		});
	};

	return (
		<>
			<InfoSection
				isOpened={
					!!(
						announcementsQuery?.data?.announcements &&
						announcementsQuery?.data?.announcements.length > 0
					)
				}
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

							const pinnedAnnouncements = concatObjects(
								parseContentByDate(getPinnedContent(announcements)),
							);

							return (
								<div className={styles.content}>
									{Object.keys(pinnedAnnouncements).length > 0 && (
										<Accordion
											accordionId="pinnedAnnouncements"
											initiallyOpened={false}
											Head={({ opened }) => (
												<div className={styles.oldContentHeader}>
													<p
														className={`${styles.date} ${styles.accordion}`}
													>
														Закрепленные обьявления
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
												/>
											</div>
										</Accordion>
									)}
									{Object.keys(oldAnnouncements).length > 0 && (
										<Accordion
											accordionId="oldAnnouncements"
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
												/>
											</div>
										</Accordion>
									)}
									<AnnouncementLayout
										announcements={actualAnnouncements}
										setAnnouncementCreating={setAnnouncementCreating}
										setInitContent={setInitContent}
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
}> = React.memo(
	({ announcements, setAnnouncementCreating, setInitContent, initiallyOpened = true }) => {
		const [changingId, setChangingId] = useState<string | null>(null);
		const changingAnnouncement = changingId ? findAnnouncementById(changingId) : null;
		const { schoolName, className } = useParams<{ className: string; schoolName: string }>();

		const [removeAnnouncement] = useMutation<
			WithTypename<{
				removeAnnouncement: string;
			}>,
			{
				className: string;
				schoolName: string;
				announcementId: string;
			}
		>(Mutations.REMOVE_ANNOUNCEMENT);
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
							query: Queries.GET_ANNOUNCEMENTS,
							variables: { className, schoolName },
						});

						if (res?.data) {
							proxy.writeQuery({
								query: Queries.GET_ANNOUNCEMENTS,
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
		>(Mutations.UPDATE_ANNOUNCEMENT);
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
							...Object.values(announcements)
								.flat()
								.find((hw) => hw._id === announcementId),
							...updates,
						},
					},
					update: (proxy, res) => {
						const data = proxy.readQuery<{ announcements: announcement[] }>({
							query: Queries.GET_ANNOUNCEMENTS,
							variables: { className, schoolName },
						});

						if (res?.data) {
							proxy.writeQuery({
								query: Queries.GET_ANNOUNCEMENTS,
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

		const [pinAnnouncement] = useMutation<
			{ pinAnnouncement: { _id: string; pinned: boolean } },
			{ schoolName: string; className: string; announcementId: string }
		>(Mutations.TOGGLE_PIN_ANNOUNCEMENT);
		const pin = (announcementId: string) => {
			const announcement = Object.values(announcements)
				.flat()
				.find((annnouncement) => annnouncement._id === announcementId);

			if (announcement) {
				pinAnnouncement({
					optimisticResponse: {
						pinAnnouncement: {
							_id: announcementId,
							pinned: !announcement.pinned,
						},
					},
					variables: {
						className,
						schoolName,
						announcementId,
					},
				});
			}
		};

		const [unpinAll] = useMutation<
			{ unpinAllHomework: boolean },
			{ className: string; schoolName: string }
		>(Mutations.UNPIN_ALL_ANNOUNCEMENTS, {
			variables: {
				className,
				schoolName,
			},
		});

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
						accordionId={`announcements${announcementDate}`}
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
										pin={pin}
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
	returnAnnouncement: (hw: Pick<announcement, 'text' | 'attachments' | 'to'>) => void;
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
