import os
import sys
import json
import argparse
import subprocess
import tempfile
import re
import glob
import platform
from pathlib import Path


class PiperTTS:
    def __init__(self, script_dir=None):
        # Set the script directory (where piper executable and voices are located)
        if script_dir is None:
            script_dir = os.path.dirname(os.path.abspath(__file__))
            script_dir = os.path.join(script_dir, 'piper')

        self.script_dir = Path(script_dir)

        # Detect OS and set appropriate executable name
        self.is_windows = platform.system() == "Windows"
        self.is_linux = platform.system() == "Linux"
        self.is_macos = platform.system() == "Darwin"

        # Set executable name based on OS
        if self.is_windows:
            self.piper_executable = self.script_dir / "piper.exe"
        else:
            self.piper_executable = self.script_dir / "piper"

        self.voices_dir = self.script_dir / "voices"

        # Language to voice model mapping
        self.supported_languages = {
            'en': 'en_US-ryan-high.onnx',  # Default English voice
            'ar': 'ar_JO-kareem-medium.onnx',  # Arabic voice
            'es': 'es_ES-mls_10246-medium.onnx',  # Spanish voice
            'fr': 'fr_FR-mls_1840-medium.onnx',  # French voice
            'de': 'de_DE-thorsten-medium.onnx',  # German voice
            'it': 'it_IT-riccardo-x_low.onnx',  # Italian voice
            'pt': 'pt_BR-faber-medium.onnx',  # Portuguese voice
            'ru': 'ru_RU-dmitri-medium.onnx',  # Russian voice
            'zh': 'zh_CN-huayan-medium.onnx',  # Chinese voice
        }

        # Check if piper is available
        self.piper_available = self._check_piper_installation()

        # Scan for available voice models
        self.available_voices = self._scan_available_voices()

    def _check_piper_installation(self):
        """Check if piper executable exists and is executable on Unix systems."""
        if not self.piper_executable.exists():
            return False

        # On Unix systems, check if the file is executable
        if not self.is_windows:
            return os.access(self.piper_executable, os.X_OK)

        return True

    def _scan_available_voices(self):
        """Scan the voices directory for available .onnx files."""
        available_voices = {}

        if not self.voices_dir.exists():
            return available_voices

        # Look for .onnx files in voices directory
        for voice_file in self.voices_dir.glob("*.onnx"):
            voice_name = voice_file.name
            # Extract language code from filename (e.g., en_US-lessac-medium.onnx -> en)
            lang_code = voice_name.split(
                '_')[0] if '_' in voice_name else voice_name.split('-')[0]

            if lang_code not in available_voices:
                available_voices[lang_code] = []
            available_voices[lang_code].append(voice_name)

        return available_voices

    def _get_voice_model_path(self, language):
        """Get the path to the voice model for a given language."""
        # Check if we have a predefined voice for this language
        if language in self.supported_languages:
            voice_file = self.supported_languages[language]
            voice_path = self.voices_dir / voice_file
            if voice_path.exists():
                return str(voice_path)

        # Fall back to any available voice for this language
        if language in self.available_voices:
            # Use first available
            voice_file = self.available_voices[language][0]
            voice_path = self.voices_dir / voice_file
            if voice_path.exists():
                return str(voice_path)

        # Fall back to English if available
        if 'en' in self.available_voices:
            voice_file = self.available_voices['en'][0]
            voice_path = self.voices_dir / voice_file
            if voice_path.exists():
                return str(voice_path)

        return None

    def _contains_arabic_text(self, text):
        """Check if text contains Arabic characters."""
        arabic_pattern = re.compile(r'[\u0600-\u06FF]')
        return bool(arabic_pattern.search(text))

    def _create_temp_file_for_text(self, text):
        """Create a temporary file with proper UTF-8 encoding for text input."""
        try:
            temp_file = tempfile.NamedTemporaryFile(mode='w', encoding='utf-8',
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

    def _build_piper_command(self, voice_model_path, output_file=None, speed=1.0, noise_scale=0.667, length_scale=1.0):
        """Build piper command."""
        cmd = [str(self.piper_executable)]

        # Voice model
        cmd.extend(['--model', voice_model_path])

        # Output file
        if output_file:
            cmd.extend(['--output_file', output_file])

        # Piper-specific parameters
        cmd.extend(['--noise_scale', str(noise_scale)])
        cmd.extend(['--length_scale', str(length_scale)])

        return cmd

    def get_installation_instructions(self):
        """Get installation instructions for Piper TTS."""
        base_instructions = {
            "download_url": "https://github.com/rhasspy/piper/releases",
            "voices_url": "https://github.com/rhasspy/piper/blob/master/VOICES.md",
        }

        if self.is_windows:
            base_instructions["setup_instructions"] = [
                "1. Download piper.exe from the releases page",
                "2. Place piper.exe in the scripts/piper folder",
                "3. Create a 'voices' folder in the scripts/piper directory",
                "4. Download .onnx voice models and place them in the voices folder",
                "5. Each voice model should have a corresponding .onnx.json config file"
            ]
        else:
            base_instructions["setup_instructions"] = [
                "1. Download piper binary for your platform from the releases page",
                "2. Place the piper binary in the scripts/piper folder",
                "3. Make the piper binary executable: chmod +x scripts/piper/piper",
                "4. Create a 'voices' folder in the scripts/piper directory",
                "5. Download .onnx voice models and place them in the voices folder",
                "6. Each voice model should have a corresponding .onnx.json config file",
                "7. For audio playback, install an audio player:",
                "   - Ubuntu/Debian: sudo apt install pulseaudio-utils (for paplay)",
                "   - Or install ALSA: sudo apt install alsa-utils (for aplay)",
                "   - Or install media players: sudo apt install mpg123 mpv vlc"
            ]

        return base_instructions

    def text_to_speech_file(self, text, language="en", output_file=None,
                            speed=1.0, noise_scale=0.667, length_scale=1.0):
        """
        Convert text to speech and save as WAV file using Piper TTS.
        :param text: Text to convert
        :param language: Language code
        :param output_file: Output WAV file path
        :param speed: Speech speed (length_scale, default 1.0)
        :param noise_scale: Noise scale for voice variation (default 0.667)
        :param length_scale: Length scale for speech rate (default 1.0)
        :return: Result dictionary
        """
        if not self.piper_available:
            return {
                "success": False,
                "error": "Piper TTS executable not found",
                "installation": self.get_installation_instructions()
            }

        temp_file_path = None
        try:
            if not text.strip():
                return {
                    "success": False,
                    "error": "Empty text provided"
                }

            # Get voice model path
            voice_model_path = self._get_voice_model_path(language)
            if not voice_model_path:
                return {
                    "success": False,
                    "error": f"No voice model found for language '{language}'",
                    "available_languages": list(self.available_voices.keys()),
                    "installation": self.get_installation_instructions()
                }

            # Generate output filename if not provided
            if output_file is None:
                output_file = f"tts_output_{hash(text) % 10000}.wav"

            # Create temporary file for text input (Piper reads from stdin or file)
            temp_file_path = self._create_temp_file_for_text(text)

            # Build piper command
            cmd = self._build_piper_command(
                voice_model_path, output_file, speed, noise_scale, length_scale
            )

            # Set environment for proper UTF-8 handling
            env = os.environ.copy()
            env['PYTHONIOENCODING'] = 'utf-8'

            # Execute piper command with text input
            with open(temp_file_path, 'r', encoding='utf-8') as input_file:
                result = subprocess.run(cmd, stdin=input_file, capture_output=True,
                                        text=True, env=env, cwd=str(self.script_dir))

            if result.returncode == 0:
                return {
                    "success": True,
                    "text": text,
                    "language": language,
                    "voice_model": os.path.basename(voice_model_path),
                    "file_path": output_file,
                    "file_size": os.path.getsize(output_file) if os.path.exists(output_file) else 0,
                    "settings": {
                        "speed": speed,
                        "noise_scale": noise_scale,
                        "length_scale": length_scale
                    }
                }
            else:
                return {
                    "success": False,
                    "error": f"Piper TTS failed: {result.stderr}",
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

    def text_to_speech_play(self, text, language="en", speed=1.0, noise_scale=0.667, length_scale=1.0):
        """
        Convert text to speech and play directly using Piper TTS.
        Note: Piper generates WAV files, so we create a temp file and could play it.
        For direct playback, you might want to pipe to a audio player.
        """
        # For Piper, we'll generate a temporary WAV file and then play it
        temp_wav_file = None
        temp_text_file = None

        try:
            # Create temporary WAV file
            temp_wav_file = tempfile.NamedTemporaryFile(
                suffix='.wav', delete=False)
            temp_wav_file.close()

            # Generate the audio file
            result = self.text_to_speech_file(
                text, language, temp_wav_file.name, speed, noise_scale, length_scale
            )

            if not result['success']:
                return result

            # Try to play the file based on OS
            try:
                if self.is_windows:
                    # Windows - use PowerShell Media.SoundPlayer
                    subprocess.run(['powershell', '-c', f'(New-Object Media.SoundPlayer "{temp_wav_file.name}").PlaySync()'],
                                   check=True, capture_output=True)
                elif self.is_macos:
                    # macOS - use afplay
                    subprocess.run(['afplay', temp_wav_file.name],
                                   check=True, capture_output=True)
                elif self.is_linux:
                    # Linux - try common audio players in order of preference
                    players = ['paplay', 'aplay', 'mpg123', 'mpv', 'cvlc']
                    played = False

                    for player in players:
                        try:
                            if player == 'paplay':
                                # PulseAudio
                                subprocess.run(
                                    [player, temp_wav_file.name], check=True, capture_output=True)
                                played = True
                                break
                            elif player == 'aplay':
                                # ALSA
                                subprocess.run(
                                    [player, temp_wav_file.name], check=True, capture_output=True)
                                played = True
                                break
                            elif player in ['mpg123', 'mpv', 'cvlc']:
                                # Media players that can handle WAV
                                subprocess.run(
                                    [player, temp_wav_file.name], check=True, capture_output=True)
                                played = True
                                break
                        except (subprocess.CalledProcessError, FileNotFoundError):
                            continue

                    if not played:
                        return {
                            "success": False,
                            "error": "No audio player found. Install one of: paplay (PulseAudio), aplay (ALSA), mpg123, mpv, or vlc."
                        }
                else:
                    # Fallback for other Unix systems
                    players = ['aplay', 'paplay', 'afplay', 'play']
                    for player in players:
                        try:
                            subprocess.run(
                                [player, temp_wav_file.name], check=True, capture_output=True)
                            break
                        except (subprocess.CalledProcessError, FileNotFoundError):
                            continue
                    else:
                        return {
                            "success": False,
                            "error": "No audio player found. Install aplay, paplay, afplay, or sox."
                        }

                return {
                    "success": True,
                    "text": text,
                    "language": language,
                    "voice_model": result.get('voice_model', 'unknown'),
                    "played": True,
                    "settings": {
                        "speed": speed,
                        "noise_scale": noise_scale,
                        "length_scale": length_scale
                    }
                }

            except subprocess.CalledProcessError as e:
                return {
                    "success": False,
                    "error": f"Failed to play audio: {str(e)}"
                }

        except Exception as e:
            return {
                "success": False,
                "error": f"TTS playback failed: {str(e)}"
            }
        finally:
            # Clean up temporary files
            if temp_wav_file and os.path.exists(temp_wav_file.name):
                self._cleanup_temp_file(temp_wav_file.name)

    def list_voices(self):
        """List available voice models."""
        if not self.piper_available:
            return {
                "success": False,
                "error": "Piper TTS executable not found",
                "installation": self.get_installation_instructions()
            }

        return {
            "success": True,
            "available_voices": self.available_voices,
            "supported_languages": list(self.supported_languages.keys()),
            "voices_directory": str(self.voices_dir),
            "piper_executable": str(self.piper_executable)
        }


def main():
    """Command line interface."""
    parser = argparse.ArgumentParser(
        description='Offline TTS using Piper TTS (Windows/Linux/macOS)')

    # Support both direct text and file input
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument('text', nargs='?', help='Text to convert to speech')
    group.add_argument('--file', '-f', help='File containing text to convert')

    parser.add_argument('--language', '-l', default='en',
                        help='Language code (en, ar, es, fr, etc.)')
    parser.add_argument('--output', '-o', help='Output WAV file path')
    parser.add_argument('--speed', '-s', type=float, default=1.0,
                        help='Speech speed (length_scale, default 1.0)')
    parser.add_argument('--noise-scale', type=float, default=0.667,
                        help='Noise scale for voice variation (default 0.667)')
    parser.add_argument('--length-scale', type=float, default=1.0,
                        help='Length scale for speech rate (default 1.0)')
    parser.add_argument('--play', action='store_true',
                        help='Play directly instead of saving to file')
    parser.add_argument('--list-voices', action='store_true',
                        help='List available voice models')
    parser.add_argument('--format', choices=['json', 'text'], default='json',
                        help='Output format')
    parser.add_argument(
        '--script-dir', help='Directory containing piper executable and voices folder')

    args = parser.parse_args()

    tts = PiperTTS(args.script_dir)

    if args.list_voices:
        result = tts.list_voices()
        if args.format == 'json':
            print(json.dumps(result, indent=2))
        else:
            if result['success']:
                print("Available voices:")
                for lang, voices in result['available_voices'].items():
                    print(f"  {lang}: {', '.join(voices)}")
            else:
                print(f"Error: {result['error']}")
        return 0 if result['success'] else 1

    # Get text from file or command line argument
    if args.file:
        try:
            with open(args.file, 'r', encoding='utf-8') as f:
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

    # Use length_scale for speed control (Piper's equivalent to speech rate)
    length_scale = 1.0 / args.speed if args.speed != 0 else 1.0

    if args.play:
        result = tts.text_to_speech_play(
            text, args.language, args.speed, args.noise_scale, length_scale
        )
    else:
        result = tts.text_to_speech_file(
            text, args.language, args.output,
            args.speed, args.noise_scale, length_scale
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
    tts = PiperTTS()

    if play_directly:
        return tts.text_to_speech_play(text, language, **kwargs)
    else:
        return tts.text_to_speech_file(text, language, output_file, **kwargs)


if __name__ == "__main__":
    sys.exit(main())
