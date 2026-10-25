#!/bin/bash
# Assembles scene PNGs + Zira narration WAVs into final MP4s (video fade in/out per scene).
set -e
cd "C:/Users/siddh/Desktop/CommunityConnect/marketing/video-build"

assemble() {
  KIND=$1; OUT=$2
  rm -f concat_$KIND.txt
  for f in scenes/$KIND/scene??.png; do
    n=$(basename "$f" .png)
    wav="scenes/$KIND/voice${n#scene}.wav"
    [ -f "$wav" ] || { echo "missing $wav"; exit 1; }
    dur=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$wav")
    total=$(python -c "print(round($dur + 1.1, 3))")
    fade=$(python -c "print(round($dur + 1.1 - 0.5, 3))")
    ffmpeg -y -v error -loop 1 -framerate 30 -i "$f" -i "$wav" \
      -vf "fade=t=in:st=0:d=0.35,fade=t=out:st=$fade:d=0.5" \
      -af "afade=t=out:st=$fade:d=0.5" \
      -c:v libx264 -tune stillimage -pix_fmt yuv420p -preset medium \
      -c:a aac -b:a 160k -ar 44100 -t "$total" "scenes/$KIND/$n.mp4"
    echo "file 'scenes/$KIND/$n.mp4'" >> concat_$KIND.txt
    echo "scene $n: ${total}s"
  done
  ffmpeg -y -v error -f concat -safe 0 -i concat_$KIND.txt -c copy "$OUT"
  echo "BUILT: $OUT ($(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT")s)"
}

assemble user "../../marketing/CommunityConnect-User-Video-Walkthrough.mp4"
assemble founder "../../../Arya Avani information/CommunityConnect-Founder-Video-Walkthrough.mp4"
