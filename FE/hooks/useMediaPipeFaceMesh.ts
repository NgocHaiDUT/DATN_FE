/**
 * Hook to safely load and initialize MediaPipe FaceMesh
 */

import { useEffect, useRef, useState } from 'react'

export const useMediaPipeFaceMesh = (onResults: (results: any) => void) => {
  const faceMeshRef = useRef<any>(null)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let faceMesh: any = null
    let mounted = true

    const initFaceMesh = async () => {
      try {
        // Wait for FaceMesh to be available
        const maxAttempts = 50
        let attempts = 0
        
        while (attempts < maxAttempts) {
          if (typeof window !== 'undefined' && (window as any).FaceMesh) {
            break
          }
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!mounted) return

        const FaceMeshClass = (window as any).FaceMesh
        if (!FaceMeshClass) {
          throw new Error('FaceMesh not available after waiting')
        }

        // Create instance
        faceMesh = new FaceMeshClass({
          locateFile: (file: string) => {
            // Force non-SIMD version for compatibility
            const fileName = file.replace('_simd_wasm_bin', '_wasm_bin')
            return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${fileName}`
          },
        })

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        })

        faceMesh.onResults(onResults)
        
        // Initialize
        if (typeof faceMesh.initialize === 'function') {
          await faceMesh.initialize()
        }

        if (!mounted) {
          if (faceMesh.close) faceMesh.close()
          return
        }

        faceMesh._ready = true
        faceMeshRef.current = faceMesh
        setIsReady(true)
        console.log('FaceMesh initialized successfully')
      } catch (err) {
        console.error('Failed to initialize FaceMesh:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      }
    }

    void initFaceMesh()

    return () => {
      mounted = false
      if (faceMesh && typeof faceMesh.close === 'function') {
        try {
          faceMesh.close()
        } catch (err) {
          console.error('Error closing FaceMesh:', err)
        }
      }
      faceMeshRef.current = null
      setIsReady(false)
    }
  }, [onResults])

  return { faceMeshRef, isReady, error }
}
