import { SourceType } from "../types";

export function createPrompt(
  sourceType: SourceType,
  content: string,
  language: string = "en"
): string {
  const sourcePrompt = getSourcePrompt(sourceType, language);
  return buildFinalPrompt(sourcePrompt, content, language);
}

function getSourcePrompt(
  sourceType: SourceType,
  language: string = "en"
): string {
  switch (sourceType) {
    case SourceType.AUDIO:
      return createAudioPrompt(language);
    case SourceType.PDF:
      return createPdfPrompt(language);
    case SourceType.IMAGE:
      return createImagePrompt(language);
    case SourceType.YOUTUBE:
      return createYoutubePrompt(language);
    default:
      return createTextPrompt();
  }
}

function createAudioPrompt(language: string): string {
  return `
    Phân tích chuyên sâu file audio này và tạo một bản ghi chú chi tiết.
    Yêu cầu:
    1. Nghe và tóm tắt nội dung chính của audio dưới dạng một bài ghi chú chi tiết.
    2. Xác định các chủ đề chính và chủ đề phụ được đề cập trong audio và ghi chú lại.
    3. Phân tích cấu trúc của audio (ví dụ: bố cục, các phần chính, sự chuyển tiếp) và ghi chú lại.
    4. Xác định giọng điệu, cảm xúc, và thái độ của người nói (nếu có) và ghi chú lại.
    5. Nếu audio chứa thông tin mang tính thuyết phục hoặc tranh luận, hãy phân tích lập luận và các bằng chứng được đưa ra và ghi chú lại.
    6. Nếu audio chứa thông tin mang tính kể chuyện, hãy phân tích cốt truyện, nhân vật, và thông điệp và ghi chú lại.
    7. Nếu audio có ẩn chứa ý nghĩa sâu xa, hãy giải thích và phân tích ý nghĩa đó và ghi chú lại.
    8. Tự động tạo một tiêu đề phù hợp cho bản ghi chú dựa trên nội dung audio.
    9. Trình bày kết quả bằng ngôn ngữ "${language}" và định dạng Markdown.
    Lưu ý:
    - Chỉ tập trung vào thông tin được nói trong audio.
    - Không thêm thông tin ngoài nội dung audio.
    - Ưu tiên phân tích sâu sắc và toàn diện.
    - Trình bày kết quả dưới dạng một bản ghi chú chi tiết, rõ ràng và dễ hiểu.
  `;
}

function createPdfPrompt(language: string): string {
  return `hãy đọc và tổng hợp toàn bộ nội dung của file PDF này
  kết quả trả về theo định dạng sau:
  - ngôn ngữ theo language code "${language}"
  - kết quả trả về theo định dạng markdown
  - kết quả trả về phải bao gồm các thông tin cơ bản như tên file, số trang, số từ, số hình ảnh, số bảng, số biểu đồ, số công thức, số chú thích, số phụ lục, số từ khóa, số ngôn ngữ, số tác giả, số ngày tạo, số ngày chỉnh sửa, số ngày xuất bản, số ngày hết hạn, số ngày tác giả chết, số ngày tác giả sinh, số ngày tác giả mất
  - tóm tắt được nội dung chính của file PDF
  - tóm tắt được các thông tin cơ bản của file PDF
  - tóm tắt được các thông tin chi tiết của file PDF
  - tóm tắt được các thông tin chuyên sâu của file PDF
  - không đưa các thông tin không cần thiết vào kết quả trả về
  - không đưa các thông tin không liên quan đến file PDF vào kết quả trả về`;
}

function createImagePrompt(language: string): string {
  return `
    hãy đưa ra và tổng hợp lại các thông tin từ nguồn ảnh đầu vào
    Kết quả trả về theo định dạng sau:
    - ngôn ngữ theo language code "${language}"
    - kết quả trả về theo định dạng markdown
    - kết quả trả về sẽ là dạng thông tin tổng hợp rồi note lại
    - trả về thông tin hình ảnh đang có
    - nếu ảnh có ẩn chứa ý nghĩa, hãy trả về ý nghĩa đó
    - nếu ảnh có chứa văn bản, hãy trả về văn bản đó và tóm tắt nội dung
    - có thể đưa ra 1 vài trích dẫn thú vị nếu ảnh đó có chứa là các thể loại ảnh nghệ thuật, ảnh kỷ niệm, ảnh gia đình
    - không đưa các thông tin không cần thiết vào kết quả trả về
    - không đưa các thông tin không liên quan đến ảnh vào
    - không tự đưa ra nhận định không chính xác
    - không đưa ra thông tin không chính xác
    - không đưa ra thông tin không đúng với ảnh
    - không đưa ra thông tin không đúng với văn bản
    - không đưa ra thông tin không đúng với nội dung
    `;
}

function createYoutubePrompt(language: string): string {
  return `Tóm tắt nội dung trong video YouTube này và tạo một bài viết ngắn với các thông tin chính của video. 
    *Không bắt đầu câu bằng bất kỳ cụm từ như “Okay, here’s a summary…” hay “Alright, here’s the summary…”.*
    
    Nội dung là: `;
}

function createTextPrompt(): string {
  return `[RAW TEXT INPUT]\n`;
}

function buildFinalPrompt(
  sourcePrompt: string,
  content: string,
  language: string = "vi"
): string {
  return `
    ${sourcePrompt}${content}

    Yêu cầu:

    1. **Xác định Mục tiêu và Tổng hợp Thông tin Đa Nguồn:**
       - Nếu nội dung đầu vào rất ngắn (dưới 30 từ), hãy xác định mục tiêu chính của người dùng dựa trên từ khóa.
       - Tiến hành tìm kiếm và tổng hợp thông tin liên quan từ nhiều nguồn đáng tin cậy.
       - Ưu tiên các nguồn thông tin chính thống và uy tín trong lĩnh vực liên quan.
       - Đảm bảo thông tin tổng hợp phản ánh đầy đủ và đa dạng các khía cạnh của chủ đề.

    2. **Tóm tắt và Trình bày Thông tin:**
       - Tóm tắt thông tin đã tổng hợp một cách ngắn gọn, súc tích và dễ hiểu.
       - Nên có thêm các emoji hợp lý cho kết quả thêm phần sinh động
       - Sắp xếp thông tin logic, có thể dưới dạng dàn ý, danh sách các bước, hoặc các điểm chính.
       - Sử dụng ngôn ngữ rõ ràng, trung lập và phù hợp với đối tượng người đọc.
       - Trình bày kết quả bằng ngôn ngữ có mã "${language}".
       - Định dạng kết quả bằng Markdown.
       - Tự động tạo tiêu đề phù hợp với nội dung.
       - **Không bắt đầu bằng các cụm “Okay, here’s a summary…” hay “Alright, here’s the summary…”.** 
         Trả về nội dung thẳng, không cần lời mở đầu dư thừa.

    3. **Lưu ý:**
       - Chỉ bao gồm thông tin liên quan trực tiếp đến mục tiêu mà người dùng muốn tìm hiểu.
       - Tránh đưa ra thông tin không cần thiết hoặc chưa được xác thực.
       - Trích dẫn hoặc đề cập đến các nguồn chính nếu có thể.
    `;
}
