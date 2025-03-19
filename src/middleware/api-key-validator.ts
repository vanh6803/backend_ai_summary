import { Request, Response, NextFunction } from "express";

export const validateApiKey = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error: "API key not configured",
      details: "Please set GEMINI_API_KEY in environment variables",
    });
    return;
  }
  next();
};
