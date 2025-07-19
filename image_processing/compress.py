from PIL import Image
import os
from tqdm import tqdm
import cv2 as cv
from concurrent.futures import ThreadPoolExecutor
from functools import partial
import multiprocessing

projects_folder = "public/projects"
out_folder = "public/projects/compressed"
out_placeholders_folder = "public/projects/placeholders"


def normalize_extensions(folder_path):
    """Rename files with uppercase extensions to lowercase"""
    print("Normalizing file extensions...")
    renamed_count = 0
    
    for filename in os.listdir(folder_path):
        # Check if file has uppercase extension that should be lowercase
        if any(filename.endswith(ext) for ext in ('.JPG', '.PNG', '.JPEG')):
            old_path = os.path.join(folder_path, filename)
            # Split filename and extension, then lowercase the extension
            name, ext = os.path.splitext(filename)
            new_filename = name + ext.lower()
            new_path = os.path.join(folder_path, new_filename)
            
            try:
                os.rename(old_path, new_path)
                renamed_count += 1
                print(f"Renamed: {filename} -> {new_filename}")
            except Exception as e:
                print(f"Error renaming {filename}: {e}")
    
    print(f"Normalized {renamed_count} file extensions")


def compress_image(image_path, out_path, quality=50):
    try:
        img = Image.open(image_path)
        img.save(out_path, optimize=True, quality=quality)
    except Exception as e:
        print(f"Error: {e}")

def is_valid_file(filename):
    return filename.lower().endswith(('.jpg', '.png', '.jpeg'))

def process_files_multithreaded(folder_path, out_path, process_func, desc, max_workers=None, **kwargs):
    """Generic function to process files with multi-threading"""
    try:
        os.mkdir(out_path)
    except:
        pass

    # Get list of valid image files
    image_files = [
        filename for filename in os.listdir(folder_path)
        if is_valid_file(filename)
    ]
    
    if not image_files:
        print(f"No image files found for {desc.lower()}")
        return
    
    # Use number of CPU cores if max_workers not specified
    if max_workers is None:
        max_workers = min(multiprocessing.cpu_count(), len(image_files))
    
    print(f"{desc} {len(image_files)} images using {max_workers} threads...")
    
    # Create wrapper function that handles the file processing
    def process_single_file(filename):
        input_path = os.path.join(folder_path, filename)
        output_path = os.path.join(out_path, filename)
        process_func(input_path, output_path, **kwargs)
        return filename
    
    # Process with thread pool
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        list(tqdm(
            executor.map(process_single_file, image_files),
            total=len(image_files),
            desc=desc
        ))


def compress_folder(folder_path, out_path, quality=50, max_workers=None):
    """Compress all images in a folder using multi-threading"""
    process_files_multithreaded(
        folder_path, out_path, compress_image, "Compressing", max_workers, quality=quality
    )


def create_placeholder(image_path, out_path):
    img = cv.imread(image_path)
    height, width, channels = img.shape
    img = cv.resize(img, (width // 2, height // 2))
    img = cv.GaussianBlur(img, (99, 99), 0)
    cv.imwrite(out_path, img)


def create_placeholders(folder_path, out_path, max_workers=None):
    """Create placeholders for all images in a folder using multi-threading"""
    process_files_multithreaded(
        folder_path, out_path, create_placeholder, "Creating placeholders", max_workers
    )


if __name__ == "__main__":
    print("Starting image processing pipeline...")
    
    # Step 1: Normalize file extensions (rename uppercase to lowercase)
    normalize_extensions(projects_folder)
    
    # Step 2: Compress original images
    print("\n--- Step 1: Compressing original images ---")
    compress_folder(projects_folder, out_folder, quality=50)
    
    # Step 3: Create placeholder images from compressed images
    print("\n--- Step 2: Creating placeholder images ---")
    create_placeholders(out_folder, out_placeholders_folder)
    
    # Step 4: Further compress placeholder images
    print("\n--- Step 3: Compressing placeholder images ---")
    compress_folder(out_placeholders_folder, out_placeholders_folder, quality=25)
    
    print("\nImage processing pipeline completed!")
