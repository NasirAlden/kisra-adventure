
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Chat, GenerateContentResponse, Part } from '@google/genai';
import { GameData, GameState, APIResponse, ErrorType } from './types';
import { SYSTEM_INSTRUCTION_PROMPT, INITIAL_USER_PROMPT, CHARACTERS, PLACES, ACTIVITIES, FOOD_ITEMS } from './constants';
import SceneDisplay from './components/SceneDisplay';
import ChoiceButton from './components/ChoiceButton';
import LoadingIndicator from './components/LoadingIndicator';
import ErrorMessage from './components/ErrorMessage';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.NotStarted);
  const [chat, setChat] = useState<Chat | null>(null);
  const [currentScene, setCurrentScene] = useState<string>('');
  const [currentImage, setCurrentImage] = useState<string>('');
  const [choices, setChoices] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<ErrorType | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const key = process.env.API_KEY;
    if (key) {
      setApiKey(key);
    } else {
      console.warn("API_KEY not found in process.env. The app might not function correctly.");
      // setError({ message: "مفتاح API غير موجود. يرجى التأكد من توفره في بيئة التشغيل.", type: "Configuration Error" });
    }
  }, []);


  const parseGeminiResponse = useCallback((responseText: string): APIResponse | null => {
    try {
      let jsonStr = responseText.trim();
      const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
      const match = jsonStr.match(fenceRegex);
      if (match && match[1]) {
        jsonStr = match[1].trim();
      }
      const parsedData = JSON.parse(jsonStr) as GameData;
      if (!parsedData.sceneDescription || !Array.isArray(parsedData.choices) || parsedData.choices.length === 0) {
        console.error("Invalid JSON structure from Gemini:", parsedData);
        throw new Error("بيانات القصة المستلمة غير صالحة أو لا تحتوي على خيارات.");
      }
      return { gameData: parsedData };
    } catch (e) {
      console.error("Failed to parse JSON response from Gemini:", e, "Raw text:", responseText);
      setError({ message: `خطأ في فهم رد الذكاء الاصطناعي: ${(e as Error).message}. النص المستلم: ${responseText.substring(0,200)}...`, type: "Parsing Error" });
      return null;
    }
  }, [setError]);

  const generateImageForScene = useCallback(async (sceneDescription: string): Promise<string> => {
    if (!apiKey) {
      console.error("API Key not available for image generation.");
      // setError({ message: "مفتاح API غير متوفر لإنشاء الصورة.", type: "Configuration Error" }); // Optional: set error if API key is missing
      return 'https://picsum.photos/600/400?grayscale&blur=2'; // Fallback
    }
    try {
      const ai = new GoogleGenAI({apiKey});
      const imagePrompt = `مشهد من قرية كسرى: ${sceneDescription}. فن رقمي, ألوان غنية, واقعي مع لمسة خيالية.`;
      
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-002', 
        prompt: imagePrompt,
        config: { numberOfImages: 1, outputMimeType: 'image/jpeg' },
      });

      if (response.generatedImages && response.generatedImages.length > 0 && response.generatedImages[0].image.imageBytes) {
        return `data:image/jpeg;base64,${response.generatedImages[0].image.imageBytes}`;
      }
      throw new Error("لم يتم إنشاء الصورة بنجاح.");
    } catch (e) {
      console.error("Error generating image with Imagen:", e);
      setError({ message: `خطأ في إنشاء الصورة: ${(e as Error).message}`, type: "API Error" });
      return 'https://picsum.photos/600/400?grayscale&blur=2&random=' + Math.random(); // Fallback with random cache bust
    }
  }, [apiKey, setError]);
  
  const processTurn = useCallback(async (prompt: string | Part[], currentChat: Chat) => {
    setIsLoading(true);
    setError(null);
    try {
      const messagePayload: Part[] = typeof prompt === 'string' ? [{ text: prompt }] : prompt;
      const result: GenerateContentResponse = await currentChat.sendMessage({ message: messagePayload }); // Corrected line
      const responseText = result.text;
      
      const parsedAPIResponse = parseGeminiResponse(responseText);

      if (parsedAPIResponse && parsedAPIResponse.gameData) {
        const { sceneDescription, choices: newChoices } = parsedAPIResponse.gameData;
        setCurrentScene(sceneDescription);
        setChoices(newChoices);
        
        const imageUrl = await generateImageForScene(sceneDescription);
        setCurrentImage(imageUrl);

        setGameState(GameState.Playing);
      } else {
        // If parseGeminiResponse returned null, it should have already set an error.
        // We ensure the game state reflects an error.
        setGameState(GameState.Error);
      }
    } catch (e) {
      console.error("Error processing turn:", e);
      setError({ message: `خطأ في التواصل مع Gemini: ${(e as Error).message}`, type: "API Error" });
      setGameState(GameState.Error);
    } finally {
      setIsLoading(false);
    }
  }, [parseGeminiResponse, generateImageForScene, setIsLoading, setError, setCurrentScene, setChoices, setCurrentImage, setGameState]);


  const initializeChat = useCallback(() => {
    if (!apiKey) {
      setError({ message: "مفتاح API غير متوفر. لا يمكن تهيئة المحادثة.", type: "Configuration Error" });
      setGameState(GameState.Error);
      return null;
    }
    try {
      const ai = new GoogleGenAI({apiKey});
      const newChat = ai.chats.create({
        model: 'gemini-2.5-flash-preview-04-17',
        config: {
          systemInstruction: {
            parts: [{text: SYSTEM_INSTRUCTION_PROMPT(CHARACTERS, PLACES, ACTIVITIES, FOOD_ITEMS)}],
            role: "system"
          },
          responseMimeType: "application/json",
        },
      });
      return newChat;
    } catch (e) {
      console.error("Error initializing Gemini chat:", e);
      setError({ message: `خطأ في تهيئة Gemini: ${(e as Error).message}`, type: "API Error" });
      setGameState(GameState.Error);
      return null;
    }
  }, [apiKey, setError, setGameState]);


  const startGame = useCallback(async () => {
    const newChatInstance = initializeChat();
    if (!newChatInstance) return;

    setChat(newChatInstance);
    setGameState(GameState.Loading);
    await processTurn(INITIAL_USER_PROMPT, newChatInstance);
  }, [initializeChat, processTurn, setChat, setGameState]);


  const handleChoice = useCallback(async (choiceText: string) => {
    if (!chat || gameState !== GameState.Playing) return;
    setGameState(GameState.Loading);
    await processTurn(choiceText, chat);
  }, [chat, gameState, processTurn, setGameState]);

  useEffect(() => {
    if (apiKey && gameState === GameState.NotStarted) {
      startGame();
    }
  }, [apiKey, gameState, startGame]);


  if (!apiKey && gameState !== GameState.Error) {
     return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-800 text-center">
        <h1 className="text-3xl font-bold mb-6 text-amber-400">مغامرة قرية كسرى</h1>
        <p className="text-xl text-slate-300 mb-4">
          يتم الآن تحميل اللعبة... يرجى التأكد من أن مفتاح API الخاص بـ Gemini مهيأ بشكل صحيح في بيئة التشغيل.
        </p>
        <LoadingIndicator />
         {error && <ErrorMessage error={error} />}
      </div>
    );
  }

  if (gameState === GameState.NotStarted || (gameState === GameState.Loading && !currentScene)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-800 text-center">
        <h1 className="text-3xl font-bold mb-6 text-amber-400">مغامرة قرية كسرى</h1>
        {gameState === GameState.NotStarted && !isLoading && (
          <button
            onClick={startGame}
            className="px-8 py-3 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-150 text-xl"
          >
            ابدأ المغامرة
          </button>
        )}
        {(isLoading || gameState === GameState.Loading) && <LoadingIndicator text="جارٍ تحضير المغامرة..." />}
        {error && <ErrorMessage error={error} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 pt-8 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 text-slate-100">
      <header className="mb-6 text-center">
        <h1 className="text-4xl font-bold text-amber-400 tracking-wide">مغامرة قرية كسرى</h1>
        <p className="text-lg text-slate-300">انغمس في حكايات وأسرار القرية</p>
      </header>

      {error && <ErrorMessage error={error} />}

      <main className="w-full max-w-3xl bg-slate-800 bg-opacity-70 shadow-2xl rounded-xl p-6 md:p-8">
        {isLoading && !currentScene && <LoadingIndicator text="جارٍ تحميل المشهد الأول..." />}
        
        <SceneDisplay imageSrc={currentImage} description={currentScene} isLoadingImage={isLoading && choices.length === 0} />

        {isLoading && choices.length > 0 && <LoadingIndicator text="جارٍ تحديث المغامرة..." />}

        {!isLoading && gameState === GameState.Playing && choices.length > 0 && (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {choices.map((choice, index) => (
              <ChoiceButton
                key={index}
                text={choice}
                onClick={() => handleChoice(choice)}
                disabled={isLoading}
              />
            ))}
          </div>
        )}
        
        {gameState === GameState.Error && !isLoading && (
           <div className="mt-6 text-center">
             <p className="text-red-400 mb-4">حدث خطأ. هل ترغب في محاولة إعادة تشغيل اللعبة؟</p>
            <button
              onClick={startGame}
              className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-slate-900 font-semibold rounded-lg shadow-md transition-colors"
            >
              إعادة البدء
            </button>
          </div>
        )}
      </main>
      <footer className="mt-8 text-center text-sm text-slate-400">
        <p>مدعوم بواسطة Gemini و Imagen API. تصميم وتطوير بواسطة IA.</p>
      </footer>
    </div>
  );
};

export default App;
