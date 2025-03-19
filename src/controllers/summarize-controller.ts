import {NextFunction, Request, Response} from "express";
import {SourceType, SummarizeRequestBody} from "../types";
import {fileToGenerativePart} from "../utils/file-utils";
import {getTranscript} from "../services/youtube-service";
import {createPrompt} from "../services/prompt-service";
import {AIService} from "../services/ai-service";

// Khởi tạo service AI với API key từ biến môi trường
const aiService = new AIService(process.env.GEMINI_API_KEY || "");

export async function summarize(
    req: Request<{}, {}, SummarizeRequestBody>,
    res: Response,
    next: NextFunction
): Promise<void> {
    const {text, sourceType, language = "en"} = req.body;
    const file = req.file;

    console.log("Request params:", {text, sourceType, language});

    try {
        let content = "";
        let result = "";

        // Xử lý đầu vào dựa trên loại nguồn
        switch (sourceType) {
            case SourceType.YOUTUBE:
                if (!text) {
                    res.status(400).json({error: "YouTube URL is required"});
                    return
                }
                const transcript = await getTranscript(text, language);
                content = transcript.rawText;
                break;

            case SourceType.TEXT:
                content = text || "";
                break;

            case SourceType.AUDIO:
            case SourceType.PDF:
            case SourceType.IMAGE:
                if (!file) {
                    res.status(400).json({error: "File is required"});
                    return;
                }
                // Xử lý file và generate content
                const filePart = fileToGenerativePart(file.path, file.mimetype);
                const filePrompt = createPrompt(sourceType, "", language);
                result = await aiService.generateContentWithFile(filePrompt, sourceType, filePart);
                break;
        }

        // Nếu chưa có kết quả (các trường hợp không có file), tạo prompt và gọi AI
        if (!result && (sourceType === SourceType.TEXT || sourceType === SourceType.YOUTUBE)) {
            const prompt = createPrompt(sourceType, content, language);
            result = await aiService.generateContent(prompt, sourceType);
        }

        res.status(200).json({result, content});
        return
    } catch (error) {
        console.error("Summarize error:", error);
        res.status(500).json({
            error: "Có lỗi xảy ra khi xử lý yêu cầu",
            details: error instanceof Error ? error.message : String(error)
        });
        return
    }
}