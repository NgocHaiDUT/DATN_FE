// Makeup drawing functions - ported from test_makeup project

type NormalizedLandmark = {
  x: number;
  y: number;
  z: number;
}

type NormalizedLandmarkList = NormalizedLandmark[]

// Helper functions
export const hexToRgb = (hex: string): string => {
  const sanitized = hex.replace('#', '')
  const normalized =
    sanitized.length === 3
      ? sanitized
          .split('')
          .map((char) => `${char}${char}`)
          .join('')
      : sanitized
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `${r},${g},${b}`
}

// Seeded random for consistent lash placement
const seededRandom = (seed: number): number => {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

// Catmull-Rom spline for smooth curves
const catmullRomPoint = (
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  p3: { x: number; y: number },
  t: number,
  tension: number = 0.5,
) => {
  const t2 = t * t
  const t3 = t2 * t

  const m0x = tension * (p2.x - p0.x)
  const m0y = tension * (p2.y - p0.y)
  const m1x = tension * (p3.x - p1.x)
  const m1y = tension * (p3.y - p1.y)

  const a0 = 2 * t3 - 3 * t2 + 1
  const a1 = t3 - 2 * t2 + t
  const a2 = -2 * t3 + 3 * t2
  const a3 = t3 - t2

  return {
    x: a0 * p1.x + a1 * m0x + a2 * p2.x + a3 * m1x,
    y: a0 * p1.y + a1 * m0y + a2 * p2.y + a3 * m1y,
  }
}

const createSmoothCurve = (
  points: { x: number; y: number }[],
  segments: number = 10,
  tension: number = 0.5,
) => {
  if (points.length < 2) return points

  const smoothPoints: { x: number; y: number }[] = []

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(points.length - 1, i + 2)]

    for (let j = 0; j < segments; j++) {
      const t = j / segments
      smoothPoints.push(catmullRomPoint(p0, p1, p2, p3, t, tension))
    }
  }

  smoothPoints.push(points[points.length - 1])
  return smoothPoints
}

// Draw basic feature (for lips, eyeshadow, foundation)
export const drawFeature = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  indices: number[],
  width: number,
  height: number,
  rgb: string,
  alpha: number,
) => {
  if (!indices.length) return

  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = `rgba(${rgb},1)`
  ctx.beginPath()

  indices.forEach((idx, pointIndex) => {
    const landmark = landmarks[idx]
    if (!landmark) return
    const x = landmark.x * width
    const y = landmark.y * height
    if (pointIndex === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

// Draw eyebrow with smooth gradients
export const drawEyebrow = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  indices: number[],
  width: number,
  height: number,
  rgb: string,
  alpha: number,
  isLeft: boolean,
) => {
  if (!indices.length) return

  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark) => Boolean(landmark))

  if (points.length < 3) return

  const canvasPoints = points.map((landmark) => ({
    x: landmark.x * width,
    y: landmark.y * height,
  }))

  const midPoint = Math.floor(canvasPoints.length / 2)
  const upperPoints = canvasPoints.slice(0, midPoint + 1)
  const lowerPoints = canvasPoints.slice(midPoint).reverse()

  const smoothUpper = createSmoothCurve(upperPoints, 8, 0.4)
  const smoothLower = createSmoothCurve(lowerPoints, 8, 0.4)

  const allX = canvasPoints.map((p) => p.x)
  const allY = canvasPoints.map((p) => p.y)
  const minX = Math.min(...allX)
  const maxX = Math.max(...allX)
  const minY = Math.min(...allY)
  const maxY = Math.max(...allY)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2

  const [r, g, b] = rgb.split(',').map((v) => parseInt(v.trim(), 10))

  ctx.save()

  const layers = 3
  for (let layer = 0; layer < layers; layer++) {
    const layerAlpha = alpha * (0.4 + layer * 0.2)
    const offsetY = (layer - 1) * 0.5

    const gradientDirection = isLeft ? [maxX, centerY, minX, centerY] : [minX, centerY, maxX, centerY]
    const gradient = ctx.createLinearGradient(
      gradientDirection[0],
      gradientDirection[1],
      gradientDirection[2],
      gradientDirection[3],
    )

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.3})`)
    gradient.addColorStop(0.15, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.6})`)
    gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.9})`)
    gradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${layerAlpha})`)
    gradient.addColorStop(0.9, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.7})`)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.2})`)

    ctx.fillStyle = gradient
    ctx.beginPath()

    if (smoothUpper.length > 0) {
      ctx.moveTo(smoothUpper[0].x, smoothUpper[0].y + offsetY)
      for (let i = 1; i < smoothUpper.length; i++) {
        ctx.lineTo(smoothUpper[i].x, smoothUpper[i].y + offsetY)
      }
    }

    if (smoothLower.length > 0) {
      for (let i = 0; i < smoothLower.length; i++) {
        ctx.lineTo(smoothLower[i].x, smoothLower[i].y + offsetY)
      }
    }

    ctx.closePath()
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'

  const outerGradient = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    Math.max(maxX - minX, maxY - minY) * 0.6,
  )
  outerGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${alpha * 0.1})`)
  outerGradient.addColorStop(0.7, `rgba(${r}, ${g}, ${b}, ${alpha * 0.05})`)
  outerGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

  ctx.fillStyle = outerGradient
  ctx.beginPath()

  const expandFactor = 1.15
  if (smoothUpper.length > 0) {
    const startX = smoothUpper[0].x + (smoothUpper[0].x - centerX) * (expandFactor - 1)
    const startY = smoothUpper[0].y + (smoothUpper[0].y - centerY) * (expandFactor - 1)
    ctx.moveTo(startX, startY)
    
    for (let i = 1; i < smoothUpper.length; i++) {
      const px = smoothUpper[i].x + (smoothUpper[i].x - centerX) * (expandFactor - 1)
      const py = smoothUpper[i].y + (smoothUpper[i].y - centerY) * (expandFactor - 1)
      ctx.lineTo(px, py)
    }
  }

  if (smoothLower.length > 0) {
    for (let i = 0; i < smoothLower.length; i++) {
      const px = smoothLower[i].x + (smoothLower[i].x - centerX) * (expandFactor - 1)
      const py = smoothLower[i].y + (smoothLower[i].y - centerY) * (expandFactor - 1)
      ctx.lineTo(px, py)
    }
  }

  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

// Draw realistic mascara
export const drawMascara = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  indices: number[],
  width: number,
  height: number,
  rgb: string,
  alpha: number,
  isLeft: boolean,
) => {
  if (indices.length < 2) return

  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark) => Boolean(landmark))

  if (points.length < 2) return

  const canvasPoints = points.map((landmark) => ({
    x: landmark.x * width,
    y: landmark.y * height,
  }))

  const [r, g, b] = rgb.split(',').map((v) => parseInt(v.trim(), 10))

  ctx.save()

  const allX = canvasPoints.map(p => p.x)
  const eyeWidth = Math.max(...allX) - Math.min(...allX)
  
  if (eyeWidth < 5) {
    ctx.restore()
    return
  }

  const getNormalAt = (t: number) => {
    const exactIndex = t * (canvasPoints.length - 1)
    const idx = Math.floor(exactIndex)
    const nextIdx = Math.min(idx + 1, canvasPoints.length - 1)
    const prevIdx = Math.max(idx - 1, 0)
    
    const tx = canvasPoints[nextIdx].x - canvasPoints[prevIdx].x
    const ty = canvasPoints[nextIdx].y - canvasPoints[prevIdx].y
    const len = Math.sqrt(tx * tx + ty * ty) || 1
    
    return { x: -ty / len, y: -tx / len }
  }

  const minLength = eyeWidth * 0.06
  const maxLength = eyeWidth * 0.15

  ctx.lineWidth = eyeWidth * 0.012
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.6})`
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.beginPath()
  ctx.moveTo(canvasPoints[0].x, canvasPoints[0].y)
  for (let i = 1; i < canvasPoints.length; i++) {
    ctx.lineTo(canvasPoints[i].x, canvasPoints[i].y)
  }
  ctx.stroke()

  const numLashes = 35
  
  for (let i = 0; i < numLashes; i++) {
    const seed = i * 1000 + (isLeft ? 1 : 2)
    let t = i / (numLashes - 1)
    
    t = Math.max(0.02, Math.min(0.98, t + (seededRandom(seed) - 0.5) * 0.03))
    
    const exactIndex = t * (canvasPoints.length - 1)
    const pointIndex = Math.floor(exactIndex)
    const nextIndex = Math.min(pointIndex + 1, canvasPoints.length - 1)
    const localT = exactIndex - pointIndex

    const baseX = canvasPoints[pointIndex].x + (canvasPoints[nextIndex].x - canvasPoints[pointIndex].x) * localT
    const baseY = canvasPoints[pointIndex].y + (canvasPoints[nextIndex].y - canvasPoints[pointIndex].y) * localT

    const peakPosition = isLeft ? 0.65 : 0.35
    const distFromPeak = Math.abs(t - peakPosition)
    const lengthFactor = Math.pow(1 - Math.min(distFromPeak * 1.5, 0.8), 1.5)
    
    const lengthVariation = 0.9 + seededRandom(seed + 1) * 0.2
    const lashLength = (minLength + (maxLength - minLength) * lengthFactor) * lengthVariation

    const normal = getNormalAt(t)
    
    let baseAngle = Math.atan2(normal.y, normal.x)
    
    const spreadFactor = isLeft ? (t - 0.5) * 0.4 : -(t - 0.5) * 0.4
    baseAngle += spreadFactor
    
    baseAngle += (seededRandom(seed + 2) - 0.5) * 0.1

    const curlStrength = 0.15 + seededRandom(seed + 3) * 0.1
    
    const cp1x = baseX + Math.cos(baseAngle) * lashLength * 0.4
    const cp1y = baseY + Math.sin(baseAngle) * lashLength * 0.4
    
    const cp2x = baseX + Math.cos(baseAngle - curlStrength) * lashLength * 0.7
    const cp2y = baseY + Math.sin(baseAngle - curlStrength) * lashLength * 0.7
    
    const endX = baseX + Math.cos(baseAngle - curlStrength * 1.5) * lashLength
    const endY = baseY + Math.sin(baseAngle - curlStrength * 1.5) * lashLength

    const baseThickness = eyeWidth * 0.008 * (0.7 + lengthFactor * 0.4)

    const segments = 3
    for (let s = 0; s < segments; s++) {
      const startT = s / segments
      const endT = (s + 1) / segments
      const thickness = baseThickness * (1 - endT * 0.6)
      
      const getPointOnCurve = (tt: number) => {
        const t1 = 1 - tt
        return {
          x: t1*t1*t1*baseX + 3*t1*t1*tt*cp1x + 3*t1*tt*tt*cp2x + tt*tt*tt*endX,
          y: t1*t1*t1*baseY + 3*t1*t1*tt*cp1y + 3*t1*tt*tt*cp2y + tt*tt*tt*endY
        }
      }
      
      const p1 = getPointOnCurve(startT)
      const p2 = getPointOnCurve(endT)
      
      ctx.lineWidth = thickness
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * (1 - s * 0.15)})`
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(p1.x, p1.y)
      ctx.lineTo(p2.x, p2.y)
      ctx.stroke()
    }
  }

  const fillLashes = 20
  for (let i = 0; i < fillLashes; i++) {
    const seed = i * 3000 + (isLeft ? 500 : 600)
    const t = seededRandom(seed) * 0.85 + 0.08
    
    const exactIndex = t * (canvasPoints.length - 1)
    const pointIndex = Math.floor(exactIndex)
    const nextIndex = Math.min(pointIndex + 1, canvasPoints.length - 1)
    const localT = exactIndex - pointIndex

    const baseX = canvasPoints[pointIndex].x + (canvasPoints[nextIndex].x - canvasPoints[pointIndex].x) * localT
    const baseY = canvasPoints[pointIndex].y + (canvasPoints[nextIndex].y - canvasPoints[pointIndex].y) * localT

    const shortLength = minLength * (0.5 + seededRandom(seed + 1) * 0.4)
    
    const normal = getNormalAt(t)
    let angle = Math.atan2(normal.y, normal.x)
    angle += (seededRandom(seed + 2) - 0.5) * 0.15
    
    const endX = baseX + Math.cos(angle) * shortLength
    const endY = baseY + Math.sin(angle) * shortLength

    ctx.lineWidth = eyeWidth * 0.005
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(baseX, baseY)
    ctx.lineTo(endX, endY)
    ctx.stroke()
  }

  ctx.restore()
}

// Draw winged eyeliner
export const drawEyeliner = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  width: number,
  height: number,
  rgb: string,
  alpha: number,
  isLeft: boolean,
) => {
  const innerCornerIdx = isLeft ? 133 : 362
  const outerCornerIdx = isLeft ? 33 : 263
  const upperLidIndices = isLeft 
    ? [133, 173, 157, 158, 159, 160, 161, 246, 33]
    : [362, 398, 384, 385, 386, 387, 388, 466, 263]
  const lowerLidOuterIndices = isLeft
    ? [33, 7, 163, 144, 145]
    : [263, 249, 390, 373, 374]

  const innerCorner = landmarks[innerCornerIdx]
  const outerCorner = landmarks[outerCornerIdx]
  
  if (!innerCorner || !outerCorner) return

  const innerX = innerCorner.x * width
  const innerY = innerCorner.y * height
  const outerX = outerCorner.x * width
  const outerY = outerCorner.y * height

  const eyeWidth = Math.abs(outerX - innerX)
  const eyeHeight = eyeWidth * 0.35

  const [r, g, b] = rgb.split(',').map((v) => parseInt(v.trim(), 10))

  ctx.save()

  const upperLidPoints = upperLidIndices
    .map(idx => landmarks[idx])
    .filter(p => p)
    .map(p => ({ x: p.x * width, y: p.y * height }))

  if (upperLidPoints.length < 3) {
    ctx.restore()
    return
  }

  const wingAngle = isLeft ? -Math.PI : -Math.PI * 0.01
  const wingLength = eyeWidth * 0.25

  const wingTipX = outerX + Math.cos(wingAngle) * wingLength
  const wingTipY = outerY + Math.sin(wingAngle) * wingLength

  const minThickness = eyeWidth * 0.012
  const maxThickness = eyeWidth * 0.045

  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'

  for (let i = 0; i < upperLidPoints.length - 1; i++) {
    const t = i / (upperLidPoints.length - 1)
    const p1 = upperLidPoints[i]
    const p2 = upperLidPoints[i + 1]
    
    const thickness = minThickness + (maxThickness - minThickness) * Math.pow(t, 1.5)
    
    ctx.lineWidth = thickness
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y)
    ctx.lineTo(p2.x, p2.y)
    ctx.stroke()
  }

  const lastUpperPoint = upperLidPoints[upperLidPoints.length - 1]
  
  const wingCtrlX = outerX + Math.cos(wingAngle) * wingLength * 0.5
  const wingCtrlY = outerY + Math.sin(wingAngle) * wingLength * 0.5

  ctx.beginPath()
  ctx.moveTo(lastUpperPoint.x, lastUpperPoint.y)
  ctx.quadraticCurveTo(wingCtrlX, wingCtrlY - eyeHeight * 0.1, wingTipX, wingTipY)
  ctx.lineWidth = maxThickness * 0.8
  ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
  ctx.stroke()

  const lowerLidPoints = lowerLidOuterIndices
    .map(idx => landmarks[idx])
    .filter(p => p)
    .map(p => ({ x: p.x * width, y: p.y * height }))

  if (lowerLidPoints.length > 1) {
    const lowerPoint = lowerLidPoints[Math.min(1, lowerLidPoints.length - 1)]
    
    ctx.beginPath()
    ctx.moveTo(outerX, outerY)
    ctx.lineTo(wingTipX, wingTipY)
    ctx.quadraticCurveTo(
      outerX + (wingTipX - outerX) * 0.3,
      outerY + (lowerPoint.y - outerY) * 0.5,
      lowerPoint.x,
      lowerPoint.y
    )
    ctx.closePath()
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'
  
  for (let i = 0; i < upperLidPoints.length - 1; i++) {
    const t = i / (upperLidPoints.length - 1)
    const p1 = upperLidPoints[i]
    const p2 = upperLidPoints[i + 1]
    
    const shadowOffset = eyeHeight * 0.08
    const shadowThickness = (minThickness + (maxThickness - minThickness) * t) * 1.5
    
    ctx.lineWidth = shadowThickness
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.15})`
    ctx.beginPath()
    ctx.moveTo(p1.x, p1.y + shadowOffset)
    ctx.lineTo(p2.x, p2.y + shadowOffset)
    ctx.stroke()
  }

  const innerHighlightRadius = eyeWidth * 0.015
  ctx.beginPath()
  ctx.arc(innerX, innerY, innerHighlightRadius, 0, Math.PI * 2)
  ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha * 0.7})`
  ctx.fill()

  ctx.restore()
}

// Draw blush with natural gradient
export const drawBlush = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  indices: number[],
  width: number,
  height: number,
  rgb: string,
  alpha: number,
) => {
  if (!indices.length) return

  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark) => Boolean(landmark))

  if (!points.length) return

  const canvasPoints = points.map((landmark) => ({
    x: landmark.x * width,
    y: landmark.y * height,
  }))

  const center = canvasPoints.reduce(
    (acc, point) => ({
      x: acc.x + point.x / canvasPoints.length,
      y: acc.y + point.y / canvasPoints.length,
    }),
    { x: 0, y: 0 },
  )

  const xs = canvasPoints.map((point) => point.x)
  const ys = canvasPoints.map((point) => point.y)

  const rangeX = Math.max(...xs) - Math.min(...xs)
  const rangeY = Math.max(...ys) - Math.min(...ys)

  const radiusX = Math.max(rangeX * 1.2, width * 0.06)
  const radiusY = Math.max(rangeY * 1.3, height * 0.05)

  const [r, g, b] = rgb.split(',').map((v) => parseInt(v.trim(), 10))

  ctx.save()
  
  ctx.globalCompositeOperation = 'multiply'

  const layers = 4
  for (let i = 0; i < layers; i++) {
    const layerAlpha = alpha * (0.3 + (i * 0.15)) / layers
    const offsetX = (Math.random() - 0.5) * radiusX * 0.1
    const offsetY = (Math.random() - 0.5) * radiusY * 0.1
    const layerRadiusX = radiusX * (0.7 + i * 0.15)
    const layerRadiusY = radiusY * (0.7 + i * 0.15)
    
    const gradient = ctx.createRadialGradient(
      center.x + offsetX,
      center.y + offsetY,
      0,
      center.x + offsetX,
      center.y + offsetY,
      Math.max(layerRadiusX, layerRadiusY),
    )

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.9})`)
    gradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.7})`)
    gradient.addColorStop(0.4, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.5})`)
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.3})`)
    gradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.1})`)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    const rotation = -Math.PI / 12
    ctx.ellipse(
      center.x + offsetX,
      center.y + offsetY,
      layerRadiusX,
      layerRadiusY * 1.2,
      rotation,
      0,
      Math.PI * 2
    )
    ctx.fill()
  }
  
  ctx.globalCompositeOperation = 'source-over'

  const highlightGradient = ctx.createRadialGradient(
    center.x,
    center.y - radiusY * 0.2,
    0,
    center.x,
    center.y - radiusY * 0.2,
    radiusX * 0.5,
  )
  highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.08})`)
  highlightGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.03})`)
  highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)
  
  ctx.fillStyle = highlightGradient
  ctx.beginPath()
  ctx.ellipse(center.x, center.y - radiusY * 0.2, radiusX * 0.5, radiusY * 0.4, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

// Draw foundation with natural blending
export const drawFoundation = (
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmarkList,
  indices: number[],
  width: number,
  height: number,
  rgb: string,
  alpha: number,
) => {
  if (!indices.length) return

  const points = indices
    .map((index) => landmarks[index])
    .filter((landmark) => Boolean(landmark))

  if (!points.length) return

  const canvasPoints = points.map((landmark) => ({
    x: landmark.x * width,
    y: landmark.y * height,
  }))

  const xs = canvasPoints.map((p) => p.x)
  const ys = canvasPoints.map((p) => p.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const faceWidth = maxX - minX
  const faceHeight = maxY - minY

  const [r, g, b] = rgb.split(',').map((v) => parseInt(v.trim(), 10))

  ctx.save()

  ctx.globalCompositeOperation = 'multiply'

  const layers = 5

  for (let layer = 0; layer < layers; layer++) {
    const layerAlpha = alpha * (0.35 + layer * 0.08)
    const scale = 1 - layer * 0.08

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      Math.max(faceWidth, faceHeight) * 0.6 * scale,
    )

    gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 1.4})`)
    gradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 1.1})`)
    gradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.8})`)
    gradient.addColorStop(0.85, `rgba(${r}, ${g}, ${b}, ${layerAlpha * 0.4})`)
    gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()

    canvasPoints.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y)
      } else {
        ctx.lineTo(point.x, point.y)
      }
    })

    ctx.closePath()
    ctx.fill()
  }

  ctx.globalCompositeOperation = 'source-over'

  const highlightGradient = ctx.createRadialGradient(
    centerX,
    centerY - faceHeight * 0.1,
    0,
    centerX,
    centerY - faceHeight * 0.1,
    faceWidth * 0.25,
  )

  highlightGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.15})`)
  highlightGradient.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.08})`)
  highlightGradient.addColorStop(1, `rgba(255, 255, 255, 0)`)

  ctx.fillStyle = highlightGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY - faceHeight * 0.1, faceWidth * 0.25, 0, Math.PI * 2)
  ctx.fill()

  const shadowAlpha = alpha * 0.12

  const leftShadowGradient = ctx.createLinearGradient(
    minX,
    centerY,
    minX + faceWidth * 0.2,
    centerY,
  )
  leftShadowGradient.addColorStop(0, `rgba(${r * 0.7}, ${g * 0.7}, ${b * 0.7}, ${shadowAlpha})`)
  leftShadowGradient.addColorStop(1, `rgba(${r * 0.7}, ${g * 0.7}, ${b * 0.7}, 0)`)

  ctx.fillStyle = leftShadowGradient
  ctx.fillRect(minX, minY, faceWidth * 0.2, faceHeight)

  const rightShadowGradient = ctx.createLinearGradient(
    maxX,
    centerY,
    maxX - faceWidth * 0.2,
    centerY,
  )
  rightShadowGradient.addColorStop(0, `rgba(${r * 0.7}, ${g * 0.7}, ${b * 0.7}, ${shadowAlpha})`)
  rightShadowGradient.addColorStop(1, `rgba(${r * 0.7}, ${g * 0.7}, ${b * 0.7}, 0)`)

  ctx.fillStyle = rightShadowGradient
  ctx.fillRect(maxX - faceWidth * 0.2, minY, faceWidth * 0.2, faceHeight)

  ctx.restore()
}
