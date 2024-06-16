import { useEffect, useRef } from 'react'

interface Item {
  title: string
  items: string[]
}

export default function PatreonListCanvas({ items }: { items: Item[] }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (ref.current) {
      ref.current.height = document.body.clientHeight
      ref.current.width = document.body.clientWidth
      runCanvas(ref.current, items)
    }
  }, [items])
  return <canvas ref={ref} className="w-full h-full overflow-hidden" />
}

function runCanvas(canvas: HTMLCanvasElement, items: Item[]) {
  if (!canvas) return
  const ctx = canvas.getContext('2d')!
  if (!ctx) return

  // Sample data: array of text groups with titles and items
  const textGroups: {
    title: string
    items: string[]
    titleFontSize?: number
    estimatedHeight?: number
    itemFontSize?: number
  }[] = [...items]

  // Function to get the maximum font size for a given text within a specified area
  function getMaxFontSize(text, maxWidth, maxHeight) {
    let fontSize = 10
    ctx.font = `${fontSize}px Arial`
    let textWidth = ctx.measureText(text).width

    while (textWidth < maxWidth && fontSize < maxHeight) {
      fontSize++
      ctx.font = `${fontSize}px Arial`
      textWidth = ctx.measureText(text).width
    }

    return fontSize - 1
  }

  // Function to estimate the height of a text group
  function estimateGroupHeight(group, titleFontSize, itemFontSize, maxWidth, padding) {
    ctx.font = `${titleFontSize}px Arial`
    const titleHeight = ctx.measureText('M').width // Approximation of height
    const itemHeight = titleHeight * 0.75
    const totalItemHeight = group.items.length * (itemHeight + padding)
    const columnsNeeded = Math.ceil(totalItemHeight / (canvas.height - titleHeight - 2 * padding))
    const totalHeight = titleHeight + Math.ceil(group.items.length / columnsNeeded) * (itemHeight + padding)
    return totalHeight
  }

  // Function to pack text groups onto the canvas
  function packTextGroups() {
    const padding = 15
    const maxColumnWidth = canvas.width / 3

    // Calculate the maximum font sizes for each group
    textGroups.forEach((group) => {
      group.titleFontSize = getMaxFontSize(group.title, maxColumnWidth, canvas.height / 10)
      group.itemFontSize = group.titleFontSize * 0.75 // Items slightly smaller than the title
      group.estimatedHeight = estimateGroupHeight(
        group,
        group.titleFontSize,
        group.itemFontSize,
        maxColumnWidth,
        padding
      )
    })

    // Sort groups by their estimated height in descending order
    textGroups.sort((a, b) => b.estimatedHeight! - a.estimatedHeight!)

    let x = 0,
      y = 0
    let maxWidthInCurrentColumn = maxColumnWidth
    let usedWidth = 0
    let usedHeight = 0
    const columnHeights: number[] = []

    // First pass: Calculate used width and height
    textGroups.forEach((group) => {
      const titleFontSize = group.titleFontSize
      const _itemFontSize = group.itemFontSize
      ctx.font = `${titleFontSize}px Arial`
      const titleHeight = ctx.measureText('M').width // Approximation of height
      const itemHeight = titleHeight * 0.75

      const totalItemHeight = group.items.length * (itemHeight + padding)
      const columnsNeeded = Math.ceil(totalItemHeight / (canvas.height - titleHeight - 2 * padding))
      const columnWidth = Math.min(maxWidthInCurrentColumn, canvas.width / columnsNeeded - padding)
      const totalHeight = titleHeight + Math.ceil(group.items.length / columnsNeeded) * (itemHeight + padding)

      if (y + totalHeight > canvas.height) {
        columnHeights.push(y)
        y = 0
        x += maxWidthInCurrentColumn + padding
        maxWidthInCurrentColumn = maxColumnWidth
      }

      y += totalHeight + padding
      maxWidthInCurrentColumn = Math.max(maxWidthInCurrentColumn, columnWidth)
    })

    columnHeights.push(y) // Add the last column height
    usedWidth = x + maxWidthInCurrentColumn
    usedHeight = Math.max(...columnHeights)

    // Calculate the starting positions to center the content
    const startX = (canvas.width - usedWidth) / 2
    const startY = (canvas.height - usedHeight) / 2

    // Second pass: Draw the text groups
    x = startX
    y = startY
    maxWidthInCurrentColumn = maxColumnWidth

    textGroups.forEach((group) => {
      const titleFontSize = group.titleFontSize
      const itemFontSize = group.itemFontSize
      ctx.font = `${titleFontSize}px Arial`
      const titleHeight = ctx.measureText('M').width // Approximation of height
      const itemHeight = titleHeight * 0.75

      const totalItemHeight = group.items.length * (itemHeight + padding)
      const columnsNeeded = Math.ceil(totalItemHeight / (canvas.height - titleHeight - 2 * padding))
      const columnWidth = Math.min(maxWidthInCurrentColumn, canvas.width / columnsNeeded - padding)
      const totalHeight = titleHeight + Math.ceil(group.items.length / columnsNeeded) * (itemHeight + padding)

      if (y + totalHeight > canvas.height) {
        y = startY
        x += maxWidthInCurrentColumn + padding
        maxWidthInCurrentColumn = maxColumnWidth
      }

      ctx.font = `${titleFontSize}px Arial`
      ctx.fillText(group.title, x, y + titleHeight)

      let itemX = x
      let itemY = y + titleHeight * 1.6 + padding
      group.items.forEach((item, _index) => {
        ctx.font = `${itemFontSize}px Arial`
        ctx.fillText(item, itemX + padding, itemY)
        itemY += itemHeight + padding

        if (itemY + itemHeight > canvas.height) {
          itemX += columnWidth + padding
          itemY = y + titleHeight + padding
          maxWidthInCurrentColumn = Math.max(maxWidthInCurrentColumn, itemX - x)
        }
      })

      y += totalHeight + padding
    })
  }

  packTextGroups()
}
