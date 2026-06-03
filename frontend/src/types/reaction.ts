export interface ContentReactionSummary {
  emoji: string;
  count: number;
  isSelected: boolean;
}

export interface ContentReactionState {
  reactions: ContentReactionSummary[];
  currentEmoji: string | null;
}

export interface ContentReactionTogglePayload {
  emoji: string;
}
