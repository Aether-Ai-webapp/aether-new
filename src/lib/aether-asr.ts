/**
 * ASR (Automatic Speech Recognition) helper using z-ai-web-dev-sdk
 * This module is server-only.
 */
import ZAI from 'z-ai-web-dev-sdk'

export async function createTranscription(audioFile: File): Promise<string> {
  try {
    const arrayBuffer = await audioFile.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString('base64')

    const sdk = await ZAI.create()
    const result = await sdk.audio.asr.create({
      file_base64: base64Audio,
    })

    if (result && typeof result === 'object' && 'text' in result) {
      return (result as { text: string }).text || ''
    }

    // If the result is a string, return it directly
    if (typeof result === 'string') {
      return result
    }

    return ''
  } catch (error) {
    console.error('ASR error:', error)
    return ''
  }
}
