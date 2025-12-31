@echo off
REM Palomaglade Christmas Lights Show - Windows Audio Sender
REM Run this on the Windows PC running LightORama

set SERVER_IP=47.197.130.122

echo.
echo ========================================
echo  Palomaglade Christmas Lights Show
echo  Audio Sender for Windows
echo ========================================
echo.
echo Server IP: %SERVER_IP%
echo.
echo Detecting audio devices...
echo.
echo Available audio devices:
echo ------------------------
ffmpeg -list_devices true -f dshow -i dummy 2>&1 | findstr /C:"audio"
echo ------------------------
echo.
echo Copy the exact device name from above (in quotes)
echo Example: Stereo Mix (Realtek High Definition Audio)
echo.
set /p "DEVICE=Enter audio device name: "

if "%DEVICE%"=="" (
    echo No device entered. Using default: Stereo Mix
    set "DEVICE=Stereo Mix"
)

echo.
echo Starting audio stream to %SERVER_IP%...
echo Using device: %DEVICE%
echo.
echo Press Ctrl+C to stop streaming
echo.

ffmpeg -fflags nobuffer -flags low_delay -f dshow -audio_buffer_size 50 -i audio="%DEVICE%" -acodec pcm_s16le -ar 48000 -ac 2 -flush_packets 1 -f wav tcp://%SERVER_IP%:4953?tcp_nodelay=1

pause
