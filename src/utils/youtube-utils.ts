/**
 * Parse video ID từ URL YouTube hoặc trả về ID nếu nó đã là ID
 * @param videoUrl URL hoặc ID của video YouTube
 * @returns Video ID hoặc null nếu không hợp lệ
 */
export function parseVideoId(videoUrl: string): string | null {
    if (!videoUrl) return null;

    // Kiểm tra nếu đó là ID của video (11 ký tự)
    if (videoUrl.length === 11 && /^[a-zA-Z0-9_-]{11}$/.test(videoUrl)) {
        return videoUrl;
    }

    // Các pattern URL phổ biến của YouTube
    const patterns = [
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?(?=.*v=([^&]+))(?:\S+)?/,
        /(?:https?:\/\/)?(?:www\.)?youtu\.be\/([^?]+)/,
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([^?]+)/
    ];

    for (const pattern of patterns) {
        const match = videoUrl.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}