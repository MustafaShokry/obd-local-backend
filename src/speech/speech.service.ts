import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface TranscriptionResult {
  success: boolean;
  text: string;
  display_text: string;
  language: string;
  file_path?: string;
  error?: string;
}

export interface TTSResult {
  success: boolean;
  text?: string;
  language?: string;
  file_path?: string;
  file_size?: number;
  error?: string;
  settings?: {
    speed?: number;
    pitch?: number;
    amplitude?: number;
  };
}

export interface TTSOptions {
  speed?: number; // 80-450 (default: 175)
  pitch?: number; // 0-99 (default: 50)
  amplitude?: number; // 0-200 (default: 100)
  outputFile?: string;
  playDirectly?: boolean;
}

export type SupportedLanguage = 'en' | 'ar' | 'es' | 'fr' | 'de';

@Injectable()
export class SpeechService {
  private readonly logger = new Logger(SpeechService.name);
  private readonly sttPythonScriptPath: string;
  private readonly ttsPythonScriptPath: string;

  constructor() {
    this.sttPythonScriptPath = path.join(
      process.cwd(),
      'scripts',
      'voice_to_text.py',
    );
    this.ttsPythonScriptPath = path.join(
      process.cwd(),
      'scripts',
      'piper_tts.py',
    );
  }

  private validateText(text: string, language: SupportedLanguage): string {
    if (!text?.trim()) {
      throw new Error('Empty text provided');
    }

    text = text.trim().replace(/\s+/g, ' ');

    if (language === 'ar') {
      text = text.replace(/[^\u0600-\u06FF\s.,!?؟،]/g, '');

      text = text.normalize('NFKC');
    }

    return text;
  }

  async transcribeVoiceFile(
    filePath: string,
    language: SupportedLanguage = 'en',
  ): Promise<TranscriptionResult> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`Audio file not found: ${filePath}`);
      }

      this.logger.log(`Transcribing file: ${filePath} (Language: ${language})`);

      const result = await this.executeSTTPythonScript(filePath, language);

      this.logger.log(
        `Transcription completed for: ${path.basename(filePath)}`,
      );

      if (result.success) {
        this.logger.log(`Transcription successful: ${result.text}`);
      } else {
        this.logger.error(`Transcription failed: ${result.error}`);
      }
      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`Transcription failed: ${errorMessage}`);
      return {
        success: false,
        text: '',
        display_text: '',
        language,
        error: errorMessage,
      };
    }
  }

  private async executeSTTPythonScript(
    filePath: string,
    language: SupportedLanguage = 'en',
  ): Promise<TranscriptionResult> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python', [
        this.sttPythonScriptPath,
        filePath,
        '--language',
        language,
        '--convert',
        '--output',
        'json',
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString('utf8');
      });

      pythonProcess.on('close', (code: number) => {
        if (code === 0) {
          try {
            const result = JSON.parse(stdout) as TranscriptionResult;
            resolve(result);
          } catch (parseError: unknown) {
            const errorMessage =
              parseError instanceof Error
                ? parseError.message
                : 'Unknown parse error';
            reject(
              new Error(
                `Failed to parse Python script output: ${errorMessage}`,
              ),
            );
          }
        } else {
          reject(
            new Error(`Python script failed with code ${code}: ${stderr}`),
          );
        }
      });

      pythonProcess.on('error', (error: Error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });
    });
  }

  async synthesizeSpeech(
    text: string,
    language: SupportedLanguage = 'en',
    options: TTSOptions = {},
  ): Promise<TTSResult> {
    try {
      // Validate and normalize the input text
      const validatedText = this.validateText(text, language);

      this.logger.log(
        `Synthesizing speech: "${validatedText.substring(0, 50)}..." (Language: ${language})`,
      );

      const result = await this.executeTTSScript(
        validatedText,
        language,
        options,
      );

      this.logger.log(
        `TTS synthesis completed for text length: ${validatedText.length}`,
      );

      if (result.success) {
        this.logger.log(`TTS synthesis successful: ${result.file_path}`);
      } else {
        this.logger.error(`TTS synthesis failed: ${result.error}`);
      }

      return result;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      this.logger.error(`TTS synthesis failed: ${errorMessage}`);
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  // private async executeTTSScript(
  //   text: string,
  //   language: SupportedLanguage = 'en',
  //   options: TTSOptions,
  // ): Promise<TTSResult> {
  //   return new Promise((resolve, reject) => {
  //     let processedText: string;
  //     let useFileInput = false;
  //     let tempFilePath: string | null = null;

  //     if (language === 'ar' || this.containsArabicText(text)) {
  //       useFileInput = true;
  //       tempFilePath = this.createTempFile(text);
  //       processedText = tempFilePath;
  //     } else {
  //       const textBuffer = Buffer.from(text, 'utf8');
  //       processedText = textBuffer.toString('utf8');
  //     }

  //     const args = [this.ttsPythonScriptPath];

  //     if (useFileInput) {
  //       args.push('--file', processedText);
  //     } else {
  //       args.push(processedText);
  //     }

  //     args.push('--language', language, '--format', 'json');

  //     if (options.speed) args.push('--speed', options.speed.toString());
  //     if (options.pitch) args.push('--pitch', options.pitch.toString());
  //     if (options.amplitude)
  //       args.push('--amplitude', options.amplitude.toString());
  //     if (options.outputFile) args.push('--output', options.outputFile);
  //     if (options.playDirectly) args.push('--play');

  //     const pythonProcess = spawn('python', args, {
  //       stdio: ['pipe', 'pipe', 'pipe'],
  //       env: {
  //         ...process.env,
  //         PYTHONIOENCODING: 'utf-8',
  //         LC_ALL: 'en_US.UTF-8',
  //       },
  //     });

  //     let stdout = '';
  //     let stderr = '';

  //     pythonProcess.stdout.on('data', (data: Buffer) => {
  //       stdout += data.toString('utf8');
  //     });

  //     pythonProcess.stderr.on('data', (data: Buffer) => {
  //       stderr += data.toString('utf8');
  //     });

  //     pythonProcess.on('close', (code: number) => {
  //       if (tempFilePath) {
  //         this.cleanupTempFile(tempFilePath);
  //       }

  //       if (code === 0) {
  //         try {
  //           const result = JSON.parse(stdout) as TTSResult;
  //           resolve(result);
  //         } catch (parseError: unknown) {
  //           const errorMessage =
  //             parseError instanceof Error
  //               ? parseError.message
  //               : 'Unknown parse error';
  //           reject(
  //             new Error(`Failed to parse TTS script output: ${errorMessage}`),
  //           );
  //         }
  //       } else {
  //         reject(new Error(`TTS script failed with code ${code}: ${stderr}`));
  //       }
  //     });

  //     pythonProcess.on('error', (error: Error) => {
  //       if (tempFilePath) {
  //         this.cleanupTempFile(tempFilePath);
  //       }
  //       reject(new Error(`Failed to start TTS process: ${error.message}`));
  //     });
  //   });
  // }
  private async executeTTSScript(
    text: string,
    language: SupportedLanguage = 'en',
    options: TTSOptions,
  ): Promise<TTSResult> {
    return new Promise((resolve, reject) => {
      let processedText: string;
      let useFileInput = false;
      let tempFilePath: string | null = null;

      // Handle Arabic text encoding properly
      if (language === 'ar' || this.containsArabicText(text)) {
        // For Arabic text, use file-based approach to avoid encoding issues
        useFileInput = true;
        tempFilePath = this.createTempFile(text);
        processedText = tempFilePath;
      } else {
        // For non-Arabic text, ensure proper UTF-8 encoding
        const textBuffer = Buffer.from(text, 'utf8');
        processedText = textBuffer.toString('utf8');
      }

      const args = [this.ttsPythonScriptPath];

      // Add text parameter based on method
      if (useFileInput) {
        args.push('--file', processedText);
      } else {
        args.push(processedText);
      }

      args.push('--language', language, '--format', 'json');

      // Add Piper-specific parameters
      if (options.speed) {
        // Convert speed to length_scale (Piper's speed control)
        const lengthScale = 1.0 / options.speed;
        args.push('--length-scale', lengthScale.toString());
      }

      // Piper uses noise_scale instead of pitch
      if (options.pitch) {
        // Convert pitch (0-99) to noise_scale (0.0-1.0)
        const noiseScale = options.pitch / 99.0;
        args.push('--noise-scale', noiseScale.toString());
      }

      // Note: Piper doesn't have amplitude control - it's handled by the system

      if (options.outputFile) args.push('--output', options.outputFile);
      if (options.playDirectly) args.push('--play');

      // Set proper encoding for the spawn process
      const pythonProcess = spawn('python', args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          PYTHONIOENCODING: 'utf-8', // Ensure Python uses UTF-8
          LC_ALL: 'en_US.UTF-8', // Set locale for proper character handling
        },
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data: Buffer) => {
        stdout += data.toString('utf8');
      });

      pythonProcess.stderr.on('data', (data: Buffer) => {
        stderr += data.toString('utf8');
      });

      pythonProcess.on('close', (code: number) => {
        // Clean up temp file if created
        if (tempFilePath) {
          this.cleanupTempFile(tempFilePath);
        }

        if (code === 0) {
          try {
            const result = JSON.parse(stdout) as TTSResult;
            resolve(result);
          } catch (parseError: unknown) {
            const errorMessage =
              parseError instanceof Error
                ? parseError.message
                : 'Unknown parse error';
            reject(
              new Error(`Failed to parse TTS script output: ${errorMessage}`),
            );
          }
        } else {
          reject(new Error(`TTS script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error: Error) => {
        // Clean up temp file if created
        if (tempFilePath) {
          this.cleanupTempFile(tempFilePath);
        }
        reject(new Error(`Failed to start TTS process: ${error.message}`));
      });
    });
  }

  private containsArabicText(text: string): boolean {
    const arabicRegex = /[\u0600-\u06FF]/;
    return arabicRegex.test(text);
  }

  private createTempFile(text: string): string {
    const tempDir = os.tmpdir();
    const fileName = `tts_arabic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.txt`;
    const filePath = path.join(tempDir, fileName);

    try {
      const utf8BOM = '\uFEFF';
      fs.writeFileSync(filePath, utf8BOM + text, { encoding: 'utf8' });
      return filePath;
    } catch (error) {
      throw new Error(`Failed to create temporary file: ${error.message}`);
    }
  }

  private cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
    }
  }
}
