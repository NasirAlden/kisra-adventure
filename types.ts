
export interface GameData {
  sceneDescription: string;
  choices: string[];
  // Potentially add other game state elements here if Gemini returns them
  // e.g., inventory: string[], characterStatus: string, etc.
}

export interface APIResponse {
  gameData?: GameData;
  error?: string; // Error message from API or parsing
}

export enum GameState {
  NotStarted = "NOT_STARTED",
  Loading = "LOADING",
  Playing = "PLAYING",
  Error = "ERROR",
  // Finished = "FINISHED", // If there's an end state
}

export interface ErrorType {
  message: string;
  type: "API Error" | "Parsing Error" | "Configuration Error" | "Unknown Error";
  details?: string;
}
