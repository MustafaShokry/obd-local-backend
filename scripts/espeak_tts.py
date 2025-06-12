import os
import sys
import json
import argparse
import subprocess
import tempfile
import re
from pathlib import Path


class ESpeakTTS:
    def __init__(self):
        self.supported_languages = {
            'en': 'en',
            'ar': 'ar',
            'es': 'es',
            'fr': 'fr',
            'de': 'de',
            'it': 'it',
            'pt': 'pt',
            'ru': 'ru',
            'zh': 'zh'
        }

        # Check if espeak-ng is installed
        self.espeak_available = self._check_espeak_installation()
        # self.espeak_available = True

    def _check_espeak_installation(self):
        """Check if espeak-ng is installed."""
        try:
            subprocess.run(['C:\\Program Files\\eSpeak NG\\espeak-ng.exe', '--version'],
                           capture_output=True, check=True)
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            return False

    def _contains_arabic_text(self, text):
        """Check if text contains Arabic characters."""
        arabic_pattern = re.compile(r'[\u0600-\u06FF]')
        return bool(arabic_pattern.search(text))

    def _create_temp_file_for_arabic(self, text):
        """Create a temporary file with proper UTF-8 encoding for Arabic text."""
        try:
            # Create temp file with UTF-8 BOM for better encoding recognition
            temp_file = tempfile.NamedTemporaryFile(mode='w', encoding='utf-8-sig',
                                                    suffix='.txt', delete=False)
            temp_file.write(text)
            temp_file.close()
            return temp_file.name
        except Exception as e:
            raise Exception(f"Failed to create temporary file: {str(e)}")

    def _cleanup_temp_file(self, file_path):
        """Clean up temporary file."""
        try:
            if os.path.exists(file_path):
                os.unlink(file_path)
        except Exception as e:
            print(
                f"Warning: Failed to cleanup temp file {file_path}: {e}", file=sys.stderr)

    def _build_espeak_command(self, text, language, speed, pitch, amplitude, output_file=None, use_file=False):
        """Build espeak command with proper encoding handling."""
        lang = self.supported_languages.get(language, 'en')

        cmd = [
            'C:\\Program Files\\eSpeak NG\\espeak-ng.exe',
            '-v', lang,
            '-s', str(speed),
            '-p', str(pitch),
            '-a', str(amplitude)
        ]

        if output_file:
            cmd.extend(['-w', output_file])

        if use_file:
            cmd.extend(['-f', text])  # text is actually file path in this case
        else:
            cmd.append(text)

        return cmd

    def get_installation_instructions(self):
        """Get installation instructions for different systems."""
        return {
            "raspberry_pi": "sudo apt update && sudo apt install espeak-ng",
            "ubuntu_debian": "sudo apt install espeak-ng",
            "centos_rhel": "sudo yum install espeak-ng",
            "arch": "sudo pacman -S espeak-ng",
            "macos": "brew install espeak-ng",
            "windows": "Download from: https://github.com/espeak-ng/espeak-ng/releases"
        }

    def text_to_speech_file(self, text, language="en", output_file=None,
                            speed=175, pitch=50, amplitude=100):
        """
        Convert text to speech and save as WAV file.
        :param text: Text to convert
        :param language: Language code
        :param output_file: Output WAV file path
        :param speed: Speech speed (80-450, default 175)
        :param pitch: Voice pitch (0-99, default 50)
        :param amplitude: Volume (0-200, default 100)
        :return: Result dictionary
        """
        if not self.espeak_available:
            return {
                "success": False,
                "error": "espeak-ng not installed",
                "installation": self.get_installation_instructions()
            }

        temp_file_path = None
        try:
            if not text.strip():
                return {
                    "success": False,
                    "error": "Empty text provided"
                }

            # Generate output filename if not provided
            if output_file is None:
                output_file = f"tts_output_{hash(text) % 10000}.wav"

            # Handle Arabic text with file-based approach
            use_file_input = False
            processed_text = text

            if language == 'ar' or self._contains_arabic_text(text):
                temp_file_path = self._create_temp_file_for_arabic(text)
                processed_text = temp_file_path
                use_file_input = True

            # Build espeak command
            cmd = self._build_espeak_command(
                processed_text, language, speed, pitch, amplitude,
                output_file, use_file_input
            )

            # Set environment for proper UTF-8 handling
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'
            if os.name != 'nt':  # Unix-like systems
                env['LC_ALL'] = 'en_US.UTF-8'

            # Execute espeak command
            result = subprocess.run(
                cmd, capture_output=True, text=True, env=env)

            if result.returncode == 0:
                return {
                    "success": True,
                    "text": text,
                    "language": language,
                    "file_path": output_file,
                    "file_size": os.path.getsize(output_file) if os.path.exists(output_file) else 0,
                    "settings": {
                        "speed": speed,
                        "pitch": pitch,
                        "amplitude": amplitude
                    },
                    "encoding_method": "file" if use_file_input else "direct"
                }
            else:
                return {
                    "success": False,
                    "error": f"espeak-ng failed: {result.stderr}",
                    "stdout": result.stdout,
                    "command": " ".join(cmd)
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"TTS generation failed: {str(e)}"
            }
        finally:
            # Clean up temporary file
            if temp_file_path:
                self._cleanup_temp_file(temp_file_path)

    def text_to_speech_play(self, text, language="en", speed=175, pitch=50, amplitude=100):
        """
        Convert text to speech and play directly (no file).
        :param text: Text to convert
        :param language: Language code
        :param speed: Speech speed
        :param pitch: Voice pitch
        :param amplitude: Volume
        :return: Result dictionary
        """
        if not self.espeak_available:
            return {
                "success": False,
                "error": "espeak-ng not installed",
                "installation": self.get_installation_instructions()
            }

        temp_file_path = None
        try:
            if not text.strip():
                return {
                    "success": False,
                    "error": "Empty text provided"
                }

            # Handle Arabic text with file-based approach
            use_file_input = False
            processed_text = text

            if language == 'ar' or self._contains_arabic_text(text):
                temp_file_path = self._create_temp_file_for_arabic(text)
                processed_text = temp_file_path
                use_file_input = True

            # Build espeak command for direct playback
            cmd = self._build_espeak_command(
                processed_text, language, speed, pitch, amplitude,
                use_file=use_file_input
            )

            # Set environment for proper UTF-8 handling
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'
            if os.name != 'nt':  # Unix-like systems
                env['LC_ALL'] = 'en_US.UTF-8'

            # Execute espeak command
            result = subprocess.run(
                cmd, capture_output=True, text=True, env=env)

            if result.returncode == 0:
                return {
                    "success": True,
                    "text": text,
                    "language": language,
                    "played": True,
                    "settings": {
                        "speed": speed,
                        "pitch": pitch,
                        "amplitude": amplitude
                    },
                    "encoding_method": "file" if use_file_input else "direct"
                }
            else:
                return {
                    "success": False,
                    "error": f"espeak-ng playback failed: {result.stderr}",
                    "stdout": result.stdout,
                    "command": " ".join(cmd)
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"TTS playback failed: {str(e)}"
            }
        finally:
            # Clean up temporary file
            if temp_file_path:
                self._cleanup_temp_file(temp_file_path)

    def list_voices(self):
        """List available voices."""
        if not self.espeak_available:
            return {"error": "espeak-ng not installed"}

        try:
            result = subprocess.run(['C:\\Program Files\\eSpeak NG\\espeak-ng.exe', '--voices'],
                                    capture_output=True, text=True, check=True)
            return {
                "success": True,
                "voices": result.stdout
            }
        except Exception as e:
            return {
                "success": False,
                "error": f"Failed to list voices: {str(e)}"
            }


def main():
    """Command line interface."""
    parser = argparse.ArgumentParser(description='Offline TTS using eSpeak-NG')

    # Support both direct text and file input
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('text', nargs='?', help='Text to convert to speech')
    group.add_argument('--file', '-f', help='File containing text to convert')

    parser.add_argument('--language', '-l', default='en',
                        help='Language code (en, ar, es, fr, etc.)')
    parser.add_argument('--output', '-o', help='Output WAV file path')
    parser.add_argument('--speed', '-s', type=int, default=175,
                        help='Speech speed (80-450)')
    parser.add_argument('--pitch', '-p', type=int, default=50,
                        help='Voice pitch (0-99)')
    parser.add_argument('--amplitude', '-a', type=int, default=100,
                        help='Volume (0-200)')
    parser.add_argument('--play', action='store_true',
                        help='Play directly instead of saving to file')
    parser.add_argument('--list-voices', action='store_true',
                        help='List available voices')
    parser.add_argument('--format', choices=['json', 'text'], default='json',
                        help='Output format')

    args = parser.parse_args()

    tts = ESpeakTTS()

    if args.list_voices:
        result = tts.list_voices()
        if args.format == 'json':
            print(json.dumps(result, indent=2))
        else:
            print(result.get('voices', result.get('error', '')))
        return 0

    # Get text from file or command line argument
    if args.file:
        try:
            with open(args.file, 'r', encoding='utf-8-sig') as f:
                text = f.read().strip()
        except Exception as e:
            print(json.dumps({
                "success": False,
                "error": f"Failed to read file {args.file}: {str(e)}"
            }))
            return 1
    else:
        text = args.text

    if not text:
        print(json.dumps({
            "success": False,
            "error": "No text provided"
        }))
        return 1

    if args.play:
        result = tts.text_to_speech_play(
            text, args.language, args.speed, args.pitch, args.amplitude
        )
    else:
        result = tts.text_to_speech_file(
            text, args.language, args.output,
            args.speed, args.pitch, args.amplitude
        )

    if args.format == 'json':
        print(json.dumps(result, indent=2))
    else:
        if result['success']:
            if args.play:
                print(f"Played: {text[:50]}...")
            else:
                print(f"Saved to: {result.get('file_path', 'unknown')}")
        else:
            print(f"Error: {result['error']}", file=sys.stderr)
            return 1

    return 0

# Function for NestJS integration


def synthesize_speech(text, language="en", output_file=None, play_directly=False, **kwargs):
    """
    Function to be called by NestJS backend.
    :param text: Text to synthesize
    :param language: Language code
    :param output_file: Output file path (optional)
    :param play_directly: Play directly without saving
    :return: Result dictionary
    """
    tts = ESpeakTTS()

    if play_directly:
        return tts.text_to_speech_play(text, language, **kwargs)
    else:
        return tts.text_to_speech_file(text, language, output_file, **kwargs)


if __name__ == "__main__":
    sys.exit(main())
