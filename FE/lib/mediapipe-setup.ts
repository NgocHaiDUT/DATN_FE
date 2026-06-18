/**
 * MediaPipe setup for Next.js
 * Workaround for Module.arguments error
 */

let isMediaPipeLoaded = false;
let mediaPipeLoadPromise: Promise<void> | null = null;

export const setupMediaPipe = () => {
  if (typeof window === 'undefined') return

  // Initialize Module object with proper configuration
  const ModuleConfig = {
    locateFile: (file: string) => {
      // Force non-SIMD version for better compatibility
      const fileName = file.replace('_simd_wasm_bin', '_wasm_bin')
      return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${fileName}`
    },
    // Prevent arguments error
    arguments_: [],
    noInitialRun: false,
    noExitRuntime: true,
  }

  // Set Module before MediaPipe loads
  if (!(window as any).Module) {
    (window as any).Module = ModuleConfig
  } else {
    // Manually assign properties to avoid read-only property errors
    const existingModule = (window as any).Module
    try {
      if (!existingModule.locateFile) {
        existingModule.locateFile = ModuleConfig.locateFile
      }
      if (!existingModule.arguments_) {
        existingModule.arguments_ = ModuleConfig.arguments_
      }
      if (existingModule.noInitialRun === undefined) {
        existingModule.noInitialRun = ModuleConfig.noInitialRun
      }
      // Skip noExitRuntime if it's read-only
    } catch (e) {
      console.warn('Could not configure Module properties:', e)
    }
  }

  // Block access to deprecated arguments property
  if ((window as any).Module) {
    Object.defineProperty((window as any).Module, 'arguments', {
      get() {
        // Return arguments_ instead
        return this.arguments_ || []
      },
      set(val) {
        // Set to arguments_ instead
        this.arguments_ = val
      },
      configurable: true,
      enumerable: false,
    })
  }
}

/**
 * Load MediaPipe scripts dynamically
 * Only loads once and returns a promise
 */
export const loadMediaPipeScripts = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  // Return existing promise if already loading
  if (mediaPipeLoadPromise) {
    return mediaPipeLoadPromise;
  }

  // Return immediately if already loaded
  if (isMediaPipeLoaded && (window as any).FaceMesh) {
    return Promise.resolve();
  }

  // Setup Module configuration before loading scripts
  setupMediaPipe();

  mediaPipeLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js';
    script.async = true;
    
    script.onload = () => {
      isMediaPipeLoaded = true;
      console.log('MediaPipe FaceMesh loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      console.error('Failed to load MediaPipe FaceMesh:', error);
      mediaPipeLoadPromise = null; // Allow retry
      reject(error);
    };
    
    document.head.appendChild(script);
  });

  return mediaPipeLoadPromise;
}
