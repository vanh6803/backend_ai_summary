import fs from "fs";
import path from "path";
import { SourceType } from "../types";

interface APILogEntry {
  timestamp: string;
  status: boolean;
  request_content: string;
  input_type: SourceType;
  execution_time: number; // thời gian thực hiện tính bằng milliseconds
  total_token: number;
  input_token: number;
  output_token: number;
  price_per_input: number;
  price_per_output: number;
  price_per_request: number;
  price_per_input_vnd: number;
  price_per_output_vnd: number;
  price_per_request_vnd: number;
}

// Tỷ giá USD sang VND
const USD_TO_VND_RATE = 24650;

// Giá cho mỗi 1 triệu token
const PRICE_PER_MILLION_TOKENS = {
  INPUT: {
    TEXT: 0.1,
    IMAGE: 0.1,
    AUDIO: 0.7,
    PDF: 0.1,
    YOUTUBE: 0.1,
  },
  OUTPUT: 0.4,
};

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "api_logs.json");

/**
 * Tính giá dựa trên số token (tính theo đơn vị 1 triệu token)
 */
function calculatePrice(tokens: number, pricePerMillion: number): number {
  return (tokens / 1_000_000) * pricePerMillion;
}

/**
 * Đọc logs từ file, trả về mảng rỗng nếu file không tồn tại hoặc không hợp lệ
 */
function readLogsFromFile(): APILogEntry[] {
  try {
    if (!fs.existsSync(LOG_FILE)) {
      return [];
    }
    const fileContent = fs.readFileSync(LOG_FILE, "utf-8");
    if (!fileContent.trim()) {
      return [];
    }
    const logs = JSON.parse(fileContent);
    return Array.isArray(logs) ? logs : [];
  } catch (error) {
    console.error("Error reading log file:", error);
    return [];
  }
}

/**
 * Ghi logs vào file với formatting
 */
function writeLogsToFile(logs: APILogEntry[]): void {
  try {
    // Ensure directory exists
    if (!fs.existsSync(LOG_DIR)) {
      fs.mkdirSync(LOG_DIR, { recursive: true });
    }
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (error) {
    console.error("Error writing to log file:", error);
    throw new Error(
      `Failed to write to log file: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

export function logAPICall(
  status: boolean,
  requestContent: string,
  inputType: SourceType,
  executionTime: number,
  totalToken: number,
  inputToken: number,
  outputToken: number,
  pricePerInput: number,
  pricePerOutput: number
): void {
  try {
    // Read existing logs with error handling
    const logs = readLogsFromFile();

    const pricePerRequest = pricePerInput + pricePerOutput;

    // Create new log entry
    const newEntry: APILogEntry = {
      timestamp: new Date().toISOString(),
      status,
      request_content: requestContent,
      input_type: inputType,
      execution_time: executionTime,
      total_token: totalToken,
      input_token: inputToken,
      output_token: outputToken,
      price_per_input: pricePerInput,
      price_per_output: pricePerOutput,
      price_per_request: pricePerRequest,
      price_per_input_vnd: pricePerInput * USD_TO_VND_RATE,
      price_per_output_vnd: pricePerOutput * USD_TO_VND_RATE,
      price_per_request_vnd: pricePerRequest * USD_TO_VND_RATE,
    };

    // Add new entry to logs
    logs.push(newEntry);

    // Write back to file with error handling
    writeLogsToFile(logs);
  } catch (error) {
    console.error("Error in logAPICall:", error);
    throw new Error(
      `Failed to log API call: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
