// Embed notes into .embed-recent-notes divs via contentIndex.json
// Supports: data-tag for filtering, data-limit for count

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })
}

function renderEmbedRecentNotes() {
  const containers = document.querySelectorAll(".embed-recent-notes")
  if (containers.length === 0) return

  const baseDir = document.body.dataset.baseUrl ?? ""
  const contentIndexPath = baseDir + "static/contentIndex.json"

  fetch(contentIndexPath)
    .then((res) => res.json())
    .then((data) => {
      const allItems = Object.values(data) as any[]
      const sorted = allItems
        .filter((item) => item.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

      containers.forEach((container) => {
        const el = container as HTMLElement
        const tag = el.dataset.tag
        const limit = parseInt(el.dataset.limit ?? "5", 10)

        let items = sorted
        if (tag) {
          const tagLower = tag.toLowerCase()
          // prefix match: "ai" matches "ai/deepseek", "ai/sft"
          items = sorted.filter(
            (item) =>
              item.tags &&
              item.tags.some((t: string) => {
                const tl = t.toLowerCase()
                return tl === tagLower || tl.startsWith(tagLower + "/")
              }),
          )
        }
        items = items.slice(0, limit)

        // clear existing content to prevent duplicate rendering
        container.innerHTML = ""

        const ul = document.createElement("ul")
        ul.className = "recent-ul embed-recent-ul"

        if (items.length === 0) {
          const li = document.createElement("li")
          li.className = "recent-li"
          li.textContent = tag
            ? `No notes found with tag "${tag}"`
            : "No notes found"
          ul.appendChild(li)
        }

        items.forEach((item) => {
          const li = document.createElement("li")
          li.className = "recent-li"

          const row = document.createElement("div")
          row.className = "recent-row"

          // Left: title + tags
          const left = document.createElement("span")
          left.className = "left"

          const titleA = document.createElement("a")
          titleA.href = baseDir + item.slug
          titleA.className = "internal title-link"
          titleA.textContent = item.title
          left.appendChild(titleA)

          if (item.tags && item.tags.length > 0) {
            item.tags.forEach((t: string) => {
              const tagA = document.createElement("a")
              tagA.href = baseDir + `tags/${t}`
              tagA.className = "internal tag-link"
              tagA.textContent = t
              left.appendChild(tagA)
            })
          }

          row.appendChild(left)

          // Date
          if (item.date) {
            const dateSpan = document.createElement("span")
            dateSpan.className = "date"
            dateSpan.textContent = formatDate(item.date)
            row.appendChild(dateSpan)
          }

          li.appendChild(row)
          ul.appendChild(li)
        })

        container.appendChild(ul)
      })
    })
    .catch((err) => {
      console.error("Failed to render embedded notes:", err)
    })
}

document.addEventListener("nav", renderEmbedRecentNotes)
