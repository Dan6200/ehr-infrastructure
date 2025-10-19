'use server'

const SNOWSTORM_API_BASE_URL =
  process.env.SNOWSTORM_API_BASE_URL || 'http://localhost:8080' // Replace with your Snowstorm instance URL

export async function searchSnomed(
  searchTerm: string,
): Promise<{ code: string; name: string }[]> {
  if (!searchTerm) {
    return []
  }

  // This endpoint may vary based on your Snowstorm configuration
  const url = `${SNOWSTORM_API_BASE_URL}/browser/MAIN/concepts?term=${searchTerm}&active=true&limit=10`

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
      },
    })

    if (!response.ok) {
      throw new Error(
        `Snowstorm API request failed with status ${response.status}`,
      )
    }

    const data = await response.json()

    // The response structure may vary; adjust this mapping accordingly
    return data.items.map((item: any) => ({
      code: item.conceptId,
      name: item.fsn.term,
    }))
  } catch (error) {
    console.error('Error fetching from Snowstorm API:', error)
    return []
  }
}
