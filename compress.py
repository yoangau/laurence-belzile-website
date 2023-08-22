from PIL import Image
import os

projects_folder = "public/projects"
out_folder = "public/projects/compressed"

def compress_image(image_path, out_path, quality=50):
    try:
        img = Image.open(image_path)
        img.save(out_path, optimize=True, quality=quality)
    except Exception as e:
        print(f"Error: {e}")

def compress_folder(folder_path, out_path, quality=50):
    try:
        os.mkdir(out_path)
    except:
        pass

    for filename in os.listdir(folder_path):
        if filename.endswith(".jpg") or filename.endswith(".png"):
            compress_image(
                os.path.join(folder_path, filename),
                os.path.join(out_path, filename),
                quality=quality
            )


if __name__ == "__main__":
    compress_folder(projects_folder, out_folder, quality=50)
