from PIL import Image
import os
from tqdm import tqdm
import cv2 as cv

projects_folder = "public/projects"
out_folder = "public/projects/compressed"
out_placeholders_folder = "public/projects/placeholders"


def compress_image(image_path, out_path, quality=50):
    try:
        img = Image.open(image_path)
        img.save(out_path, optimize=True, quality=quality)
    except Exception as e:
        print(f"Error: {e}")

def is_valid_file(filename):
    extension = filename.lower().split('.')[-1]
    return extension in ['jpg', 'png']

def compress_folder(folder_path, out_path, quality=50):
    try:
        os.mkdir(out_path)
    except:
        pass

    for filename in tqdm(os.listdir(folder_path)):
        if is_valid_file(filename):
            compress_image(
                os.path.join(folder_path, filename),
                os.path.join(out_path, filename),
                quality=quality
            )


def create_placeholder(image_path, out_path):
    img = cv.imread(image_path)
    height, width, channels = img.shape
    img = cv.resize(img, (width // 2, height // 2))
    img = cv.GaussianBlur(img, (99, 99), 0)
    cv.imwrite(out_path, img)


def create_placeholders(folder_path, out_path):
    try:
        os.mkdir(out_path)
    except:
        pass

    for filename in tqdm(os.listdir(folder_path)):
        if is_valid_file(filename):
            create_placeholder(
                os.path.join(folder_path, filename),
                os.path.join(out_path, filename)
            )


if __name__ == "__main__":
    compress_folder(projects_folder, out_folder, quality=50)
    create_placeholders(out_folder, out_placeholders_folder)
    compress_folder(out_placeholders_folder,
                    out_placeholders_folder, quality=25)
