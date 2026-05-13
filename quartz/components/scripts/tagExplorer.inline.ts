import { FullSlug, resolveRelative } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"

type TagNode = {
  name: string
  count: number
  children: Record<string, TagNode>
  articles: Array<{ slug: FullSlug; title: string }>
}

let currentTagState: Array<{ path: string; collapsed: boolean }> = []

function toggleTagFolder(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as HTMLElement
  
  const isSvg = target.nodeName === "svg"
  const folderContainer = isSvg
    ? target.parentElement
    : target.parentElement?.parentElement
  
  if (!folderContainer) return
  
  const childContainer = folderContainer.nextElementSibling as HTMLElement
  if (!childContainer) return
  
  childContainer.classList.toggle("open")
  
  const isCollapsed = !childContainer.classList.contains("open")
  const tagPath = (folderContainer as HTMLElement).dataset.tagpath!
  
  const entry = currentTagState.find(e => e.path === tagPath)
  if (entry) {
    entry.collapsed = isCollapsed
  } else {
    currentTagState.push({ path: tagPath, collapsed: isCollapsed })
  }
  localStorage.setItem("tagTreeState", JSON.stringify(currentTagState))
}

function buildTagTree(data: Record<string, ContentDetails>): TagNode {
  const root: TagNode = {
    name: "",
    count: 0,
    children: {},
    articles: [],
  }
  
  for (const entry of Object.values(data)) {
    for (const tag of entry.tags) {
      const parts = tag.split("/")
      let current = root
      
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]
        const path = parts.slice(0, i + 1).join("/")
        
        if (!current.children[part]) {
          current.children[part] = {
            name: part,
            count: 0,
            children: {},
            articles: [],
          }
        }
        
        current = current.children[part]
        current.count++
        
        if (i === parts.length - 1) {
          current.articles.push({ slug: entry.slug, title: entry.title })
        }
      }
    }
  }
  
  return root
}

function createTagFolderNode(
  currentSlug: FullSlug,
  node: TagNode,
  pathPrefix: string,
  depth: number,
): HTMLLIElement {
  const li = document.createElement("li")
  const isLeaf = Object.keys(node.children).length === 0 && node.articles.length > 0
  const hasChildren = Object.keys(node.children).length > 0 || node.articles.length > 0
  
  if (isLeaf) {
    // Article link
    const a = document.createElement("a")
    a.href = resolveRelative(currentSlug, node.articles[0].slug)
    a.className = "tag-article-link"
    a.textContent = node.articles[0].title || node.name
    if (currentSlug === node.articles[0].slug) {
      a.classList.add("active")
    }
    li.appendChild(a)
  } else {
    // Folder
    const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name
    
    const folderContainer = document.createElement("div")
    folderContainer.className = "tag-folder-container"
    folderContainer.dataset.tagpath = fullPath
    
    const saved = currentTagState.find(e => e.path === fullPath)
    const isCollapsed = saved?.collapsed ?? true
    
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    icon.setAttribute("xmlns", "http://www.w3.org/2000/svg")
    icon.setAttribute("width", "12")
    icon.setAttribute("height", "12")
    icon.setAttribute("viewBox", "5 8 14 8")
    icon.setAttribute("fill", "none")
    icon.setAttribute("stroke", "currentColor")
    icon.setAttribute("stroke-width", "2")
    icon.setAttribute("stroke-linecap", "round")
    icon.setAttribute("stroke-linejoin", "round")
    icon.className = "tag-folder-icon"
    icon.innerHTML = "<polyline points=\"6 9 12 15 18 9\"></polyline>"
    
    const title = document.createElement("span")
    title.className = "tag-folder-title"
    title.textContent = `${node.name} (${node.count})`
    
    folderContainer.appendChild(icon)
    folderContainer.appendChild(title)
    
    if (currentSlug.startsWith(`tags/${fullPath}`)) {
      folderContainer.classList.add("active")
    }
    
    li.appendChild(folderContainer)
    
    if (hasChildren) {
      const folderOuter = document.createElement("div")
      folderOuter.className = "tag-folder-outer"
      if (!isCollapsed) {
        folderOuter.classList.add("open")
      }
      
      const ul = document.createElement("ul")
      ul.className = "tag-folder-content"
      
      // Sort children alphabetically
      const sortedKeys = Object.keys(node.children).sort((a, b) => {
        const aHasChildren = Object.keys(node.children[a].children).length > 0
        const bHasChildren = Object.keys(node.children[b].children).length > 0
        if (aHasChildren !== bHasChildren) return bHasChildren ? 1 : -1
        return a.localeCompare(b)
      })
      
      for (const key of sortedKeys) {
        const childNode = createTagFolderNode(currentSlug, node.children[key], fullPath, depth + 1)
        ul.appendChild(childNode)
      }
      
      // Add articles under this tag
      for (const article of node.articles) {
        const articleLi = document.createElement("li")
        const articleA = document.createElement("a")
        articleA.href = resolveRelative(currentSlug, article.slug)
        articleA.className = "tag-article-link"
        articleA.textContent = article.title || article.slug
        if (currentSlug === article.slug) {
          articleA.classList.add("active")
        }
        articleLi.appendChild(articleA)
        ul.appendChild(articleLi)
      }
      
      folderOuter.appendChild(ul)
      li.appendChild(folderOuter)
      
      // Add click handler
      folderContainer.addEventListener("click", toggleTagFolder)
      window.addCleanup(() => folderContainer.removeEventListener("click", toggleTagFolder))
    }
  }
  
  return li
}

async function setupTagExplorer(currentSlug: FullSlug) {
  const allTagExplorers = document.querySelectorAll("div.tag-explorer") as NodeListOf<HTMLElement>
  
  for (const explorer of allTagExplorers) {
    const storageData = localStorage.getItem("tagTreeState")
    currentTagState = storageData ? JSON.parse(storageData) : []
    
    const data = await fetchData as Record<string, ContentDetails>
    const tree = buildTagTree(data)
    
    const explorerUl = explorer.querySelector(".tag-ul") as HTMLUListElement
    if (!explorerUl) continue
    
    explorerUl.innerHTML = ""
    
    const sortedRoots = Object.keys(tree.children).sort((a, b) => 
      tree.children[b].count - tree.children[a].count
    )
    
    for (const key of sortedRoots) {
      const node = createTagFolderNode(currentSlug, tree.children[key], "", 0)
      explorerUl.appendChild(node)
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
