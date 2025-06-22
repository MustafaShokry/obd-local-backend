import os
import sys
import json
import wave
import argparse
from vosk import Model, KaldiRecognizer

# Import the required libraries for Arabic text representation
import arabic_reshaper
from bidi.algorithm import get_display


def find_vosk_model_path(language="en"):
    """
    Find the VOSK model path for the given language.
    :param language: 'en' for English, 'ar' for Arabic
    :return: Path to the VOSK model directory
    """
    models = {
        "en": "en-us",
        "ar": "ar",
    }
    model_name = models.get(language)

    if not model_name:
        raise ValueError(f"Unsupported language: {language}")

    # Common model paths on different systems
    possible_paths = [
        # Current directory
        os.path.join(os.getcwd(), model_name),
        # Script directory
        os.path.join(os.path.dirname(os.path.abspath(__file__)), model_name),
        # User home directory
        os.path.expanduser(f"~/vosk-models/{model_name}"),
        # System-wide installation (Linux)
        f"/usr/share/vosk-models/{model_name}",
        f"/usr/local/share/vosk-models/{model_name}",
        # Windows common paths
        os.path.join(os.environ.get('APPDATA', ''), 'vosk-models', model_name),
        # macOS common paths
        os.path.expanduser(
            f"~/Library/Application Support/vosk-models/{model_name}"),
    ]

    for path in possible_paths:
        if os.path.exists(path) and os.path.isdir(path):
            return path

    # If no model found, return the model name for VOSK to try its default resolution
    return model_name


def load_vosk_model(language="en"):
    """
    Load the VOSK model based on the selected language.
    :param language: 'en' for English, 'ar' for Arabic
    :return: VOSK model object
    """
    try:
        model_path = find_vosk_model_path(language)

        # Try to load the model
        if os.path.exists(model_path) and os.path.isdir(model_path):
            return Model(model_path)
        else:
            # Fallback to VOSK's default model resolution
            return Model(lang=model_path)

    except Exception as e:
        raise Exception(
            f"Failed to load VOSK model for language '{language}': {str(e)}")


def check_ffmpeg_availability():
    """
    Check if ffmpeg is available on the system.
    :return: True if ffmpeg is available, False otherwise
    """
    try:
        import subprocess
        result = subprocess.run(['ffmpeg', '-version'],
                                capture_output=True,
                                text=True,
                                timeout=5)
        return result.returncode == 0
    except (subprocess.TimeoutExpired, FileNotFoundError, subprocess.SubprocessError):
        return False


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

        # Check if ffmpeg is available
        if not check_ffmpeg_availability():
            raise Exception(
                "ffmpeg not found. Please install ffmpeg:\n"
                "  Ubuntu/Debian: sudo apt-get install ffmpeg\n"
                "  CentOS/RHEL: sudo yum install ffmpeg\n"
                "  Arch: sudo pacman -S ffmpeg\n"
                "  Or provide a WAV file directly."
            )

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

        result = subprocess.run(
            cmd, check=True, capture_output=True, text=True)
        return output_file

    except subprocess.CalledProcessError as e:
        error_msg = e.stderr if e.stderr else str(e)
        raise Exception(f"Failed to convert audio file: {error_msg}")
    except FileNotFoundError:
        raise Exception(
            "ffmpeg not found. Please install ffmpeg or provide a WAV file.")


def get_installation_instructions():
    """
    Get installation instructions for different operating systems.
    :return: String with installation instructions
    """
    return """
Installation Instructions:

1. Install Python dependencies:
   pip install vosk arabic-reshaper python-bidi

2. Install ffmpeg (for audio conversion):
   
   Ubuntu/Debian:
     sudo apt-get update
     sudo apt-get install ffmpeg
   
   CentOS/RHEL/Fedora:
     sudo yum install ffmpeg
     # or for newer versions:
     sudo dnf install ffmpeg
   
   Arch Linux:
     sudo pacman -S ffmpeg
   
   macOS (using Homebrew):
     brew install ffmpeg
   
   Windows:
     Download from https://ffmpeg.org/download.html

3. Download VOSK models:
   
   English model:
     wget https://alphacephei.com/vosk/models/vosk-model-small-en-us-0.15.zip
     unzip vosk-model-small-en-us-0.15.zip
     mv vosk-model-small-en-us-0.15 en-us
   
   Arabic model:
     wget https://alphacephei.com/vosk/models/vosk-model-ar-mgb2-0.4.zip
     unzip vosk-model-ar-mgb2-0.4.zip
     mv vosk-model-ar-mgb2-0.4 ar
   
   Place the model folders in one of these locations:
   - Current directory (where the script is run)
   - Script directory
   - ~/vosk-models/
   - /usr/share/vosk-models/ (Linux, requires sudo)
   - /usr/local/share/vosk-models/ (Linux, requires sudo)
"""


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
    parser.add_argument('--install-help', action='store_true',
                        help='Show installation instructions')

    args = parser.parse_args()

    if args.install_help:
        print(get_installation_instructions())
        return 0

    file_path = args.file_path

    # Convert file if needed
    if args.convert:
        try:
            file_path = convert_audio_to_wav(args.file_path)
            print(f"Converted audio file to: {file_path}", file=sys.stderr)
        except Exception as e:
            print(f"Conversion error: {e}", file=sys.stderr)
            print(
                "\nFor installation help, run: python voice_to_text.py --install-help", file=sys.stderr)
            return 1

    # Process the audio file
    try:
        result = process_audio_file(file_path, args.language)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        print("\nFor installation help, run: python voice_to_text.py --install-help", file=sys.stderr)
        return 1

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
