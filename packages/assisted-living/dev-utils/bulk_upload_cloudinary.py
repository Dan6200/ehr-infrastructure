import cloudinary
import cloudinary.uploader
import os
from dotenv import load_dotenv

def bulk_upload_to_cloudinary(local_folder_path, cloudinary_folder_path, already_uploaded_file):
    """
    Uploads files from a local folder to a specified Cloudinary folder,
    skipping files that are already listed as uploaded.
    """
    load_dotenv()

    # Configure Cloudinary
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET')
    )

    if not (cloudinary.config().cloud_name and cloudinary.config().api_key and cloudinary.config().api_secret):
        print("Cloudinary API credentials are not set.")
        return

    # Read already uploaded files
    uploaded_filenames = set()
    try:
        with open(already_uploaded_file, 'r') as f:
            for line in f:
                if line.startswith('- https://'):
                    # Extract filename from URL, e.g., '.../image.png' -> 'image.png'
                    filename = line.strip().split('/')[-1]
                    uploaded_filenames.add(filename)
        print(f"Found {len(uploaded_filenames)} already uploaded files.")
    except FileNotFoundError:
        print(f"Warning: {already_uploaded_file} not found. Will attempt to upload all files.")

    if not os.path.isdir(local_folder_path):
        print(f"Error: Local folder '{local_folder_path}' does not exist.")
        return

    print(f"Starting selective upload from '{local_folder_path}' to Cloudinary folder '{cloudinary_folder_path}'...")

    uploaded_count = 0
    skipped_count = 0
    failed_uploads = []

    for root, _, files in os.walk(local_folder_path):
        for filename in files:
            if filename in uploaded_filenames:
                skipped_count += 1
                continue

            local_file_path = os.path.join(root, filename)
            public_id_base = os.path.splitext(os.path.relpath(local_file_path, local_folder_path))[0].replace(os.sep, '/')

            try:
                print(f"Uploading {filename}...")
                cloudinary.uploader.upload(
                    local_file_path,
                    folder=cloudinary_folder_path,
                    public_id=public_id_base,
                    resource_type="auto"
                )
                uploaded_count += 1
            except Exception as e:
                failed_uploads.append(f"{local_file_path}: {e}")
                print(f"Failed to upload {filename}: {e}")

    print("\n--- Upload Summary ---")
    print(f"Successfully uploaded: {uploaded_count}")
    print(f"Skipped (already uploaded): {skipped_count}")
    if failed_uploads:
        print(f"Failed uploads: {len(failed_uploads)}")
        for failure in failed_uploads:
            print(f"- {failure}")
    else:
        print("No failed uploads.")

if __name__ == "__main__":
    local_folder = "public/avatars"
    cloudinary_target_folder = "lean-ehr/assisted-living/avatars"
    already_uploaded_file = "dev-utils/already_uploaded_avatars.txt"
    bulk_upload_to_cloudinary(local_folder, cloudinary_target_folder, already_uploaded_file)