import { FullSlug, resolveRelative } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"

type TagEntry = {
  tag: string
  count: number
}

let currentTagState: Array<{ tag: string; collapsed: boolean }> = []

function toggleTag(this: HTMLElement) {
  const tagContainer = this.closest(".tag-item") as HTMLElement
  if (!tagContainer) return
  const tagName = tagContainer.dataset.tag!
  const isCollapsed = tagContainer.classList.toggle("collapsed")
  
  const entry = currentTagState.find(e => e.tag === tagName)
  if (entry) {
    entry.collapsed = isCollapsed
  } else {
    currentTagState.push({ tag: tagName, collapsed: isCollapsed })
  }
  localStorage.setItem("tagState", JSON.stringify(currentTagState))
}

function createTagItem(currentSlug: FullSlug, entry: TagEntry): HTMLLIElement {
  const li = document.createElement("li")
  li.className = "tag-item"
  li.dataset.tag = entry.tag
  
  // Check saved state
  const saved = currentTagState.find(e => e.tag === entry.tag)
  if (saved?.collapsed) {
    li.classList.add("collapsed")
  }
  
  const a = document.createElement("a")
  a.href = resolveRelative(currentSlug, `tags/${entry.tag}` as FullSlug)
  a.className = "tag-link"
  a.textContent = `${entry.tag} (${entry.count})`
  
  if (currentSlug === `tags/${entry.tag}`) {
    a.classList.add("active")
  }
  
  li.appendChild(a)
  return li
}

async function setupTagExplorer(currentSlug: FullSlug) {
  const allTagExplorers = document.querySelectorAll("div.tag-explorer") as NodeListOf<HTMLElement>
  
  for (const explorer of allTagExplorers) {
    // Load saved state
    const storageData = localStorage.getItem("tagState")
    currentTagState = storageData ? JSON.parse(storageData) : []
    
    // Fetch all content data
    const data = await fetchData as Record<string, ContentDetails>
    
    // Aggregate tags and count
    const tagCounts: Record<string, number> = {}
    for (const entry of Object.values(data)) {
      for (const tag of entry.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      }
    }
    
    // Convert to array and sort by count descending
    const sortedTags: TagEntry[] = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
    
    const explorerUl = explorer.querySelector(".tag-ul") as HTMLUListElement
    if (!explorerUl) continue
    
    // Clear existing
    explorerUl.innerHTML = ""
    
    // Create and insert tag items
    for (const entry of sortedTags) {
      const li = createTagItem(currentSlug, entry)
      explorerUl.appendChild(li)
    }
    
    // Set up click handlers
    const tagLinks = explorer.querySelectorAll(".tag-item .tag-link")
    for (const link of tagLinks) {
      link.addEventListener("click", toggleTag)
      window.addCleanup(() => link.removeEventListener("click", toggleTag))
    }
  }
}

document.addEventListener("prenav", () => {
  const explorer = document.querySelector(".tag-ul")
  if (!explorer) return
  sessionStorage.setItem("tagExplorerScrollTop", explorer.scrollTop.toString())
})

document.addEventListener("nav", async (e: CustomEventMap["nav"]) => {
  const currentSlug = e.detail.url
  await setupTagExplorer(currentSlug)
  
  // Restore scroll position
  const explorer = document.querySelector(".tag-ul")
  if (explorer) {
    const scrollTop = sessionStorage.getItem("tagExplorerScrollTop")
    if (scrollTop) {
      explorer.scrollTop = parseInt(scrollTop)
    } else {
      const activeElement = explorer.querySelector(".active")
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth" })
      }
    }
  }
})
