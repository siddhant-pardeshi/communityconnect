# Synthesizes narration WAVs with Microsoft Zira (soft female voice) for both videos.
Add-Type -AssemblyName System.Speech
$root = "C:\Users\siddh\Desktop\CommunityConnect\marketing\video-build\scenes"
foreach ($kind in @("user", "founder")) {
  $files = Get-ChildItem (Join-Path $root $kind) -Filter "narration*.txt" | Sort-Object Name
  foreach ($f in $files) {
    $wav = $f.FullName -replace "narration", "voice" -replace "\.txt$", ".wav"
    $s = New-Object System.Speech.Synthesis.SpeechSynthesizer
    $s.SelectVoice("Microsoft Zira Desktop")
    $s.Rate = -1
    $s.SetOutputToWaveFile($wav)
    $text = [System.IO.File]::ReadAllText($f.FullName)
    $s.Speak($text)
    $s.Dispose()
    Write-Host ("tts ok: " + $kind + "/" + $f.Name)
  }
}
Write-Host "ALL TTS DONE"
