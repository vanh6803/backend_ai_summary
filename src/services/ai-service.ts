import { GenerativeModel, GoogleGenerativeAI } from "@google/generative-ai";
import { SourceType } from "../types";
import { logAPICall } from "../utils/log_file";

export class AIService {
  private apiKey: string;
  private client: GoogleGenerativeAI;
  private model: GenerativeModel;

  // Giá cho mỗi 1 triệu token
  private readonly PRICE_PER_MILLION_TOKENS = {
    [SourceType.TEXT]: 0.1,
    [SourceType.IMAGE]: 0.1,
    [SourceType.AUDIO]: 0.7,
    [SourceType.PDF]: 0.1,
    [SourceType.YOUTUBE]: 0.1,
  };
  private readonly OUTPUT_PRICE_PER_MILLION = 0.4;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = this.client.getGenerativeModel({ model: "gemini-2.0-flash" });
  }

  private getModel(): GenerativeModel {
    return this.model;
  }

  /**
   * Tính giá dựa trên số token (tính theo đơn vị 1 triệu token)
   */
  private calculatePrice(tokens: number, pricePerMillion: number): number {
    return (tokens / 1_000_000) * pricePerMillion;
  }

  /**
   * Gọi API để tạo nội dung
   */
  async generateContent(
    prompt: string,
    sourceType: SourceType
  ): Promise<string> {
    const startTime = Date.now();
    try {
      const model = this.getModel();
      const response = await model.generateContent(prompt);
      const result = response.response.text();
      const executionTime = Date.now() - startTime;

      const metadata = response.response.usageMetadata;
      const inputTokens = metadata?.promptTokenCount || 0;
      const outputTokens = metadata?.candidatesTokenCount || 0;
      const totalTokens = metadata?.totalTokenCount || 0;

      // Tính giá dựa trên số token (tính theo đơn vị 1 triệu token)
      const pricePerInput = this.calculatePrice(
        inputTokens,
        this.PRICE_PER_MILLION_TOKENS[sourceType]
      );
      const pricePerOutput = this.calculatePrice(
        outputTokens,
        this.OUTPUT_PRICE_PER_MILLION
      );

      // Log API call
      logAPICall(
        true,
        prompt,
        sourceType,
        executionTime,
        totalTokens,
        inputTokens,
        outputTokens,
        pricePerInput,
        pricePerOutput
      );

      return this.cleanMarkdownResult(result);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      // Log failed API call
      logAPICall(false, prompt, sourceType, executionTime, 0, 0, 0, 0, 0);
      console.error("Error generating content:", error);
      throw new Error(
        `AI content generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Gọi API để tạo nội dung từ prompt và file
   */
  async generateContentWithFile(
    prompt: string,
    sourceType: SourceType,
    filePart: any
  ): Promise<string> {
    const startTime = Date.now();
    try {
      const model = this.getModel();
      const response = await model.generateContent([prompt, filePart]);
      const result = response.response.text();
      const executionTime = Date.now() - startTime;

      const metadata = response.response.usageMetadata;
      const inputTokens = metadata?.promptTokenCount || 0;
      const outputTokens = metadata?.candidatesTokenCount || 0;
      const totalTokens = metadata?.totalTokenCount || 0;

      // Tính giá dựa trên số token (tính theo đơn vị 1 triệu token)
      const pricePerInput = this.calculatePrice(
        inputTokens,
        this.PRICE_PER_MILLION_TOKENS[sourceType]
      );
      const pricePerOutput = this.calculatePrice(
        outputTokens,
        this.OUTPUT_PRICE_PER_MILLION
      );

      // Log API call
      logAPICall(
        true,
        prompt,
        sourceType,
        executionTime,
        totalTokens,
        inputTokens,
        outputTokens,
        pricePerInput,
        pricePerOutput
      );

      return this.cleanMarkdownResult(result);
    } catch (error) {
      const executionTime = Date.now() - startTime;
      // Log failed API call
      logAPICall(false, prompt, sourceType, executionTime, 0, 0, 0, 0, 0);
      console.error("Error generating content with file:", error);
      throw new Error(
        `AI content generation failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Làm sạch kết quả markdown từ AI
   */
  private cleanMarkdownResult(rawResult: string): string {
    return rawResult
      .replace(/```markdown/g, "") // Loại bỏ tag markdown thừa
      .replace(/```/g, "") // Loại bỏ tag code thừa
      .replace(/\n/g, "<p>") // Thay mọi \n bằng <p>
      .replace(/\*\*(.*?)\*\*/g, "**$1**") // Giữ nguyên bold formatting
      .trim(); // Loại bỏ khoảng trắng thừa ở đầu và cuối
  }
}
