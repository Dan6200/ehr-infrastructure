import cloudinary
import cloudinary.api
import os
from dotenv import load_dotenv

def list_assets_in_folder(cloudinary_folder_path):
    """
    Lists all assets in a specified Cloudinary folder.
    """
    # Load environment variables from .env file
    load_dotenv()

    # Configure Cloudinary
    cloudinary.config(
        cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
        api_key=os.environ.get('CLOUDINARY_API_KEY'),
        api_secret=os.environ.get('CLOUDINARY_API_SECRET')
    )

    if not cloudinary.config().cloud_name or not cloudinary.config().api_key or not cloudinary.config().api_secret:
        print("Cloudinary API credentials are not set. Please check your .env file or environment variables.")
        return

    print(f"Fetching assets from Cloudinary folder: {cloudinary_folder_path}...")

    try:
        # Use the Admin API to list resources
        response = cloudinary.api.resources(
            type='upload',
            prefix=cloudinary_folder_path,
            max_results=500 # Adjust as needed
        )
        
        assets = response.get('resources', [])
        
        if not assets:
            print("No assets found in the specified folder.")
            return

        print(f"Found {len(assets)} assets:")
        for asset in assets:
            print(f"- {asset['secure_url']}")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    target_folder = "lean-ehr/assisted-living/avatars"
    list_assets_in_folder(target_folder)
