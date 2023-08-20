import cv2
import json
import blurhash
from tqdm import tqdm

projects_file = "src/data/projects.json"
output_file = "src/data/projects-e.json"


def get_projects():
    projects = None
    with open(projects_file, 'r') as f:
        projects = json.load(f)
    return projects


def enhance_projects(projects):
    for project in tqdm(projects):
        image_path = f"public{project['src']}"
        project['h'], project['w'] = get_image_dimensions(image_path)
        project['blurhash'] = get_blurhash(image_path)


def get_image_dimensions(image_path):
    img = cv2.imread(image_path)
    height, width, channels = img.shape
    return height, width


def write_projects(projects):
    with open(output_file, 'w') as f:
        json.dump(projects, f, indent=4)


def get_blurhash(image_path):
    hash = None
    with open(image_path, 'rb') as image_file:
        hash = blurhash.encode(image_file, x_components=4, y_components=3)
    return hash


if __name__ == "__main__":
    projects = get_projects()
    enhance_projects(projects)
    write_projects(projects)
