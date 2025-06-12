import os
import sys
import json
import wave
import argparse
from vosk import Model, KaldiRecognizer

# Import the required libraries for Arabic text representation
import arabic_reshaper
from bidi.algorithm import get_display


def load_vosk_model(language="en"):
    """
    Load the VOSK model based on the selected language.
    :param language: 'en' for English, 'ar' for Arabic
    :return: VOSK model object
    """
    models = {
        "en": "en-us",
        "ar": "ar",
    }
    model = models.get(language)

    return Model(lang=model)


def process_audio_file(file_path, language="en"):
    """
    Process audio file and extract text using VOSK.
    :param file_path: Path to the audio file (WAV format)
    :param language: 'en' for English, 'ar' for Arabic
    :return: Dictionary with transcribed text and language
    """
    try:
        # Load VOSK model
        model = load_vosk_model(language)
        recognizer = KaldiRecognizer(model, 16000)

        # Open and read the audio file
        with wave.open(file_path, 'rb') as wf:
            # Check if the audio file has the correct format
            if wf.getnchannels() != 1 or wf.getsampwidth() != 2 or wf.getframerate() != 16000:
                print(
                    f"Warning: Audio file should be mono, 16-bit, 16kHz. Current: {wf.getnchannels()} channels, {wf.getsampwidth()*8}-bit, {wf.getframerate()}Hz")

            # Process audio in chunks
            full_text = ""
            while True:
                data = wf.readframes(4000)  # Read 4000 frames at a time
                if len(data) == 0:
                    break

                if recognizer.AcceptWaveform(data):
                    result = json.loads(recognizer.Result())
                    text = result.get("text", "")
                    if text:
                        full_text += text + " "

            # Get final result
            final_result = json.loads(recognizer.FinalResult())
            final_text = final_result.get("text", "")
            if final_text:
                full_text += final_text

        # Clean up the text
        full_text = full_text.strip()

        # Process Arabic text for proper display if needed
        display_text = full_text
        if language == "ar" and full_text:
            reshaped_text = arabic_reshaper.reshape(full_text)
            display_text = get_display(reshaped_text)

        return {
            "success": True,
            "text": full_text,
            "display_text": display_text,
            "language": language,
            "file_path": file_path
        }

    except FileNotFoundError:
        return {
            "success": False,
            "error": f"Audio file not found: {file_path}",
            "text": "",
            "language": language
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error processing audio file: {str(e)}",
            "text": "",
            "language": language
        }


def convert_audio_to_wav(input_file, output_file=None):
    """
    Convert audio file to WAV format using ffmpeg (if available).
    :param input_file: Path to input audio file
    :param output_file: Path to output WAV file (optional)
    :return: Path to converted WAV file
    """
    try:
        import subprocess

        if output_file is None:
            base_name = os.path.splitext(input_file)[0]
            output_file = f"{base_name}_converted.wav"

        # Use ffmpeg to convert to the required format
        cmd = [
            'ffmpeg', '-i', input_file,
            '-acodec', 'pcm_s16le',
            '-ar', '16000',
            '-ac', '1',
            '-y',  # Overwrite output file
            output_file
        ]

        subprocess.run(cmd, check=True, capture_output=True)
        return output_file

    except subprocess.CalledProcessError as e:
        raise Exception(f"Failed to convert audio file: {e}")
    except FileNotFoundError:
        raise Exception(
            "ffmpeg not found. Please install ffmpeg or provide a WAV file.")


def main():
    """
    Main function for command line usage
    """
    parser = argparse.ArgumentParser(
        description='Convert voice file to text using VOSK')
    parser.add_argument('file_path', help='Path to the audio file')
    parser.add_argument('--language', '-l', choices=['en', 'ar'], default='en',
                        help='Language for speech recognition (en for English, ar for Arabic)')
    parser.add_argument('--convert', '-c', action='store_true',
                        help='Convert non-WAV files to WAV format first')
    parser.add_argument('--output', '-o', choices=['json', 'text'], default='json',
                        help='Output format (json or text)')

    args = parser.parse_args()

    file_path = args.file_path

    # Convert file if needed
    if args.convert:
        try:
            file_path = convert_audio_to_wav(args.file_path)
            print(f"Converted audio file to: {file_path}", file=sys.stderr)
        except Exception as e:
            print(f"Conversion error: {e}", file=sys.stderr)
            return 1

    # Process the audio file
    result = process_audio_file(file_path, args.language)

    # Output the result
    if args.output == 'json':
        print(json.dumps(result, ensure_ascii=False, indent=2))
    else:
        if result['success']:
            print(result['display_text'])
        else:
            print(f"Error: {result['error']}", file=sys.stderr)
            return 1

    return 0

# Function specifically for NestJS backend integration


def transcribe_voice_file(file_path, language="en"):
    """
    Function to be called by NestJS backend.
    :param file_path: Path to the voice file
    :param language: Language code ('en' or 'ar')
    :return: Dictionary with transcription results
    """
    return process_audio_file(file_path, language)


if __name__ == "__main__":
    sys.exit(main())
