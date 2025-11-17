import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params
    const filePath = path.join('/')

    console.log('[Image Proxy] Requesting file:', filePath)

    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[Image Proxy] Auth error:', authError)
      return new NextResponse('Unauthorized', { status: 401 })
    }

    console.log('[Image Proxy] User authenticated:', user.id)

    // Verify the file belongs to the authenticated user
    const pathParts = filePath.split('/')
    const fileUserId = pathParts[0]

    if (fileUserId !== user.id) {
      console.error('[Image Proxy] Unauthorized access attempt:', {
        fileUserId,
        authenticatedUserId: user.id,
      })
      return new NextResponse('Forbidden', { status: 403 })
    }

    // Try to download the file from Supabase storage
    const { data, error } = await supabase.storage
      .from('workout-selfies')
      .download(filePath)

    if (error) {
      console.error('[Image Proxy] Storage download error:', {
        message: error.message,
        name: error.name,
        cause: error.cause,
        filePath,
      })

      // Fallback: Try to get a signed URL and fetch through it
      console.log('[Image Proxy] Attempting signed URL fallback...')
      const { data: signedData, error: signedError } = await supabase.storage
        .from('workout-selfies')
        .createSignedUrl(filePath, 60) // 60 second expiry

      if (signedError || !signedData?.signedUrl) {
        console.error('[Image Proxy] Signed URL fallback also failed:', signedError)
        return new NextResponse(`Image not found: ${error.message}`, { status: 404 })
      }

      console.log('[Image Proxy] Fetching via signed URL')
      // Fetch the image through the signed URL
      const imageResponse = await fetch(signedData.signedUrl)

      if (!imageResponse.ok) {
        console.error('[Image Proxy] Failed to fetch via signed URL:', imageResponse.status)
        return new NextResponse('Failed to fetch image', { status: imageResponse.status })
      }

      const imageBuffer = await imageResponse.arrayBuffer()
      const imageContentType = imageResponse.headers.get('content-type') || 'image/jpeg'

      console.log('[Image Proxy] Successfully fetched via signed URL')
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': imageContentType,
          'Cache-Control': 'public, max-age=3600, must-revalidate',
        },
      })
    }

    if (!data) {
      console.error('[Image Proxy] No data returned for file:', filePath)
      return new NextResponse('Image not found: No data', { status: 404 })
    }

    console.log('[Image Proxy] Successfully fetched image:', {
      filePath,
      size: data.size,
      type: data.type,
    })

    // Get the content type from the blob
    const contentType = data.type || 'image/jpeg'

    // Convert blob to array buffer
    const buffer = await data.arrayBuffer()

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600, must-revalidate',
      },
    })
  } catch (error) {
    console.error('[Image Proxy] Unexpected error:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
