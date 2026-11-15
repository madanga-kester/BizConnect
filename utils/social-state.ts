import type { ChatMessage, Conversation, DraftPost, Post, PostComment } from "@/types/domain";

export interface ModerationReport {
  id: string;
  target: string;
  reason: string;
  details: string;
  status: "submitted" | "under_review" | "closed";
  createdAt: string;
}

export function toggleId(ids: string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function saveDraftRecord(drafts: DraftPost[], draft: DraftPost): DraftPost[] {
  return [draft, ...drafts.filter((item) => item.id !== draft.id)];
}

export function addCommentRecord(posts: Post[], postId: string, comment: PostComment): Post[] {
  return posts.map((post) => post.id === postId ? { ...post, comments: [...post.comments, comment] } : post);
}

export function addReplyRecord(posts: Post[], postId: string, commentId: string, reply: PostComment["replies"][number]): Post[] {
  return posts.map((post) => post.id === postId ? {
    ...post,
    comments: post.comments.map((comment) => comment.id === commentId ? { ...comment, replies: [...comment.replies, reply] } : comment),
  } : post);
}

export function findActiveDuplicateReport(reports: ModerationReport[], target: string, reason: string): ModerationReport | undefined {
  return reports.find((report) => report.target === target && report.reason === reason && report.status !== "closed");
}

export function appendReport(reports: ModerationReport[], report: ModerationReport): { reports: ModerationReport[]; created: boolean; existing?: ModerationReport } {
  const existing = findActiveDuplicateReport(reports, report.target, report.reason);
  return existing ? { reports, created: false, existing } : { reports: [report, ...reports], created: true };
}

export function createConversationRecord(
  conversations: Conversation[],
  input: Pick<Conversation, "participantId" | "participantName" | "businessId">,
  id: string,
  now: string,
): { conversations: Conversation[]; conversationId: string; created: boolean } {
  const existing = conversations.find((item) => item.participantId === input.participantId && item.businessId === input.businessId);
  if (existing) return { conversations, conversationId: existing.id, created: false };
  const conversation: Conversation = { ...input, id, lastMessage: "Start a conversation", updatedAt: now, unread: 0, messages: [] };
  return { conversations: [conversation, ...conversations], conversationId: id, created: true };
}

export function appendLocalMessage(conversations: Conversation[], conversationId: string, message: ChatMessage, now: string): Conversation[] {
  return conversations.map((item) => item.id === conversationId ? {
    ...item,
    lastMessage: message.text || "Image attachment selected in the local demo",
    updatedAt: now,
    messages: [...item.messages, message],
  } : item);
}
