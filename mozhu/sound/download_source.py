import requests

urls = [
    "https://img.ithome.com/app/magiclines/sound/bg.mp3",
    "https://img.ithome.com/app/magiclines/sound/move.mp3",
    "https://img.ithome.com/app/magiclines/sound/bomb.wav",
    "https://img.ithome.com/app/magiclines/sound/congratulation.wav",
    "https://img.ithome.com/app/magiclines/sound/gameover.wav",
    "https://img.ithome.com/app/magiclines/sound/select.mp3",
    "https://img.ithome.com/app/magiclines/sound/button.wav"
]

for url in urls:
    fname = url.split("/")[-1]
    print(f"Downloading {fname} ...")
    r = requests.get(url, stream=True)
    with open(fname, "wb") as f:
        for chunk in r.iter_content(1024):
            f.write(chunk)
    print(f"Saved {fname}")