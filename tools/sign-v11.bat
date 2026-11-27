@echo off
chcp 65001 >nul
cd /d C:\Users\shaio\muzika-app
echo.
echo ===== Muzika version 11 signing =====
echo Paste the password (Ctrl+V or right-click), then press Enter.
echo.
set /p MZ_PASS=Password:
cls
if "%MZ_PASS%"=="" (
  echo Empty password - close this window and tell Claude.
  pause
  exit /b
)
"C:\Program Files\Android\Android Studio\jbr\bin\jarsigner.exe" -keystore android.keystore -storepass:env MZ_PASS -keypass:env MZ_PASS -sigalg SHA256withRSA -digestalg SHA-256 -signedjar app-release-signed-v11.aab app\build\outputs\bundle\release\app-release.aab android
set MZ_PASS=
echo.
if exist app-release-signed-v11.aab (
  echo DONE - signed file created. You can close this window.
) else (
  echo FAILED - the file was not created. Close this window and tell Claude.
)
pause
