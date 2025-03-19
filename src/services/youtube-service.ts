import youtubeDl from 'youtube-dl-exec';
import fs from 'fs/promises';
import path from 'path';
import {FormattedTranscript, TranscriptSegment} from '../types';
import {parseVideoId} from '../utils/youtube-utils';

/**
 * Lấy transcript từ một video YouTube sử dụng youtube-dl-exec
 * @param videoUrl URL hoặc ID của video YouTube
 * @param language Mã ngôn ngữ của phụ đề (mặc định: 'en')
 * @returns FormattedTranscript object chứa nội dung transcript
 */
export async function getTranscript(videoUrl: string, language: string = 'en'): Promise<FormattedTranscript> {
    try {
        const videoId = parseVideoId(videoUrl);

        if (!videoId) {
            throw new Error('Invalid YouTube URL or video ID');
        }

        // Tạo một tên file tạm thời để lưu subtitles
        const tempDir = path.join(process.cwd(), 'temp');
        await fs.mkdir(tempDir, {recursive: true});
        const outputFile = path.join(tempDir, `${videoId}`);

        // Tải phụ đề bằng youtube-dl-exec với ngôn ngữ được chỉ định
        await youtubeDl(videoUrl, {
            skipDownload: true,
            writeSub: true,
            writeAutoSub: true,
            subLang: language,
            subFormat: 'vtt',
            output: outputFile,
            cookies: "./yt_c.txt",
            addHeader: ['User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36']
        });

        // Đọc file phụ đề được tải về
        let vttContent;
        try {
            // Thử đọc phụ đề thông thường trước
            vttContent = await fs.readFile(`${outputFile}.${language}.vtt`, 'utf8');
        } catch (error) {
            try {
                // Nếu không có phụ đề thông thường, thử đọc phụ đề tự động
                vttContent = await fs.readFile(`${outputFile}.${language}.auto.vtt`, 'utf8');
            } catch (subError) {
                throw new Error(`No subtitles found in "${language}" language for this video`);
            }
        }

        // Parse nội dung VTT thành dạng tương tự youtube-transcript
        const transcriptItems = parseVTTToTranscriptItems(vttContent);

        // Xóa file tạm sau khi đã đọc
        try {
            await fs.unlink(`${outputFile}.${language}.vtt`).catch(() => {
            });
            await fs.unlink(`${outputFile}.${language}.auto.vtt`).catch(() => {
            });
            // Xóa các file khác được tạo ra nếu có
            const files = await fs.readdir(tempDir);
            for (const file of files) {
                if (file.startsWith(videoId)) {
                    await fs.unlink(path.join(tempDir, file)).catch(() => {
                    });
                }
            }
        } catch (error) {
            console.warn('Could not clean up temporary files:', error);
        }

        return formatTranscript(transcriptItems);
    } catch (error) {
        console.error('Error fetching transcript:', error);
        throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : String(error)}`);
    }
}

/**
 * Parse VTT content thành định dạng tương tự youtube-transcript
 */
/**
 * Parse VTT content thành định dạng tương tự youtube-transcript
 */
function parseVTTToTranscriptItems(vttContent: string): Array<{ text: string, offset: number, duration: number }> {
    const transcriptItems: Array<{ text: string, offset: number, duration: number }> = [];
    const lines = vttContent.split('\n');

    let index = 0;
    while (index < lines.length) {
        const line = lines[index].trim();

        // Tìm timestamp line (có định dạng "00:00:00.000 --> 00:00:00.000")
        if (line.includes(' --> ')) {
            const times = line.split(' --> ');
            const startTime = parseVTTTimestamp(times[0]);
            const endTime = parseVTTTimestamp(times[1]);

            // Text content thường là dòng tiếp theo
            index++;
            let text = '';
            while (index < lines.length && lines[index].trim() !== '') {
                // Skip embedded timing tags like <00:00:01.920><c> file</c>
                const cleanLine = lines[index].replace(/<\d+:\d+:\d+\.\d+>|<\/?\w+>/g, '');
                if (cleanLine.trim()) {
                    text += cleanLine.trim() + ' ';
                }
                index++;
            }

            if (text.trim()) {
                transcriptItems.push({
                    text: text.trim(),
                    offset: startTime * 1000, // Convert to milliseconds
                    duration: (endTime - startTime) * 1000 // Convert to milliseconds
                });
            }
        }

        index++;
    }

    return transcriptItems;
}

/**
 * Chuyển đổi timestamp VTT (00:00:00.000) thành số giây
 */
function parseVTTTimestamp(timestamp: string): number {
    // Xử lý cả định dạng 00:00:00.000 và 00:00.000
    const parts = timestamp.split(':');
    let hours = 0, minutes = 0, seconds = 0;

    if (parts.length === 3) {
        hours = parseInt(parts[0], 10);
        minutes = parseInt(parts[1], 10);
        seconds = parseFloat(parts[2]);
    } else if (parts.length === 2) {
        minutes = parseInt(parts[0], 10);
        seconds = parseFloat(parts[1]);
    } else {
        seconds = parseFloat(parts[0]);
    }

    return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Định dạng transcript thành dạng có thời gian
 */
function formatTranscript(transcriptItems: any[]): FormattedTranscript {
    if (!transcriptItems.length) {
        return {rawText: '', formattedText: '', segments: []};
    }

    let rawText = '';
    let formattedText = '';
    const segments: TranscriptSegment[] = [];

    let currentText = '';
    let currentStartTime = transcriptItems[0].offset / 1000;
    let totalDuration = 0;

    transcriptItems.forEach(item => {
        currentText += `${item.text} `;
        totalDuration += item.duration / 1000;

        if (isEndOfSentence(item.text) || totalDuration > 5) {
            const segmentTime = formatTime(item.offset);
            rawText += `${currentText.trim()} `;
            formattedText += `${segmentTime}\t${currentText.trim()}\n`;

            segments.push({
                text: currentText.trim(),
                start: currentStartTime,
                duration: totalDuration
            });

            currentText = '';
            totalDuration = 0;
            currentStartTime = (item.offset + item.duration) / 1000;
        }
    });

    // Xử lý câu cuối cùng nếu có
    if (currentText.trim()) {
        const lastItem = transcriptItems[transcriptItems.length - 1];
        const lastSegmentTime = formatTime(lastItem.offset);
        formattedText += `${lastSegmentTime}\t${currentText.trim()}\n`;
        rawText += `${currentText.trim()} `;

        segments.push({
            text: currentText.trim(),
            start: currentStartTime,
            duration: totalDuration
        });
    }

    return {
        rawText: rawText.trim(),
        formattedText: formattedText.trim(),
        segments
    };
}

/**
 * Kiểm tra nếu đoạn văn bản đã kết thúc một câu
 */
function isEndOfSentence(text: string): boolean {
    return /[.!?]$/.test(text.trim());
}

/**
 * Định dạng thời gian từ milliseconds sang HH:MM:SS
 */
function formatTime(milliseconds: number): string {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}