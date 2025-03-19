import { Request, Response } from "express";
import fs from "fs";
import path from "path";

interface APILogEntry {
  timestamp: string;
  status: boolean;
  request_content: string;
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

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "api_logs.json");

export async function getDashboard(req: Request, res: Response): Promise<void> {
  try {
    // Đọc file log
    let logs: APILogEntry[] = [];
    if (fs.existsSync(LOG_FILE)) {
      const fileContent = fs.readFileSync(LOG_FILE, "utf-8");
      if (fileContent.trim()) {
        logs = JSON.parse(fileContent);
      }
    }

    // Render view với dữ liệu log
    res.render("dashboard", { logs });
  } catch (error) {
    console.error("Error reading log file:", error);
    res.status(500).json({
      error: "Có lỗi xảy ra khi đọc file log",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
