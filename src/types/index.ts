export enum SourceType {
    AUDIO = "audio",
    TEXT = "text",
    PDF = "pdf",
    IMAGE = "image",
    YOUTUBE = "youtube",
}

export interface SummarizeRequestBody {
    text?: string;
    sourceType: SourceType;
    language?: string;
}

export interface TranscriptSegment {
    text: string;
    start: number;
    duration: number;
}

export interface FormattedTranscript {
    rawText: string;       // Toàn bộ văn bản không có thời gian
    formattedText: string; // Văn bản có định dạng thời gian
    segments: TranscriptSegment[]; // Các đoạn phân đoạn
}
