from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

SOURCE = Path('public/assets/world/russian')
for source in SOURCE.glob('floor-*-v1.png'):
    image = Image.open(source).convert('RGB')
    pixels = list(image.getdata())
    width, height = image.size
    eligible = bytearray(width * height)
    for index, (red, green, blue) in enumerate(pixels):
        if max(red, green, blue) - min(red, green, blue) <= 10 and (red + green + blue) / 3 >= 185:
            eligible[index] = 1
    visited = bytearray(width * height)
    queue = deque()
    for x in range(width):
        if eligible[x]: queue.append(x)
        if eligible[(height - 1) * width + x]: queue.append((height - 1) * width + x)
    for y in range(height):
        if eligible[y * width]: queue.append(y * width)
        if eligible[y * width + width - 1]: queue.append(y * width + width - 1)
    while queue:
        index = queue.popleft()
        if visited[index] or not eligible[index]:
            continue
        visited[index] = 1
        y, x = divmod(index, width)
        if y > 0: queue.append(index - width)
        if y + 1 < height: queue.append(index + width)
        if x > 0: queue.append(index - 1)
        if x + 1 < width: queue.append(index + 1)
    alpha = Image.frombytes('L', image.size, bytes(0 if is_background else 255 for is_background in visited)).filter(ImageFilter.GaussianBlur(0.6))
    rgba = Image.merge('RGBA', (*image.split(), alpha))
    bbox = alpha.getbbox()
    if bbox is None:
        raise RuntimeError(f'No foreground found in {source}')
    cropped = rgba.crop(bbox)
    padding = 12
    padded = Image.new('RGBA', (cropped.width + padding * 2, cropped.height + padding * 2))
    padded.alpha_composite(cropped, (padding, padding))
    scale = 512 / padded.width
    resized = padded.resize((512, round(padded.height * scale)), Image.Resampling.LANCZOS)
    output = source.with_name(source.name.replace('-v1.png', '-v2.png'))
    resized.save(output, optimize=True)
    print(output, resized.size)
