import { FullSlug, resolveRelative } from "../../util/path"
import { ContentDetails } from "../../plugins/emitters/contentIndex"

type TagNode = {
  name: string
  count: number
  children: Record<string, TagNode>
  articles: Array<{ slug: FullSlug; title: string }>
}

let currentTagState: Array<{ path: string; collapsed: boolean }> = []
let folderDefaultState: "collapsed" | "open" = "collapsed"
let useSavedState = true

function toggleTagFolder(evt: MouseEvent) {
  evt.stopPropagation()
  const target = evt.target as HTMLElement
  if (!target) return

  const isSvg = target.nodeName === "svg"

  // svg.parentElement gives us the div (folder-container)
  const folderContainer = isSvg
    ? target.parentElement
    : target.parentElement?.parentElement

  if (!folderContainer) return

  const childFolderContainer = folderContainer.nextElementSibling as HTMLElement
  if (!childFolderContainer) return

  childFolderContainer.classList.toggle("open")

  const isCollapsed = !childFolderContainer.classList.contains("open")
  const tagPath = (folderContainer as HTMLElement).dataset.tagpath!

  const currentFolderState = currentTagState.find(item => item.path === tagPath)
  if (currentFolderState) {
    currentFolderState.collapsed = isCollapsed
  } else {
    currentTagState.push({
      path: tagPath,
      collapsed: isCollapsed,
    })
  }

  if (useSavedState) {
    localStorage.setItem("tagTreeState", JSON.stringify(currentTagState))
  }
}

function createArticleNode(currentSlug: FullSlug, article: { slug: FullSlug; title: string }): HTMLLIElement {
  const template = document.getElementById("template-tag-article") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const a = li.querySelector("a") as HTMLAnchorElement
  a.href = resolveRelative(currentSlug, article.slug)
  a.dataset.for = article.slug
  a.textContent = article.title || article.slug

  if (currentSlug === article.slug) {
    a.classList.add("active")
  }

  return li
}

function createTagFolderNode(
  currentSlug: FullSlug,
  node: TagNode,
  pathPrefix: string,
): HTMLLIElement {
  const template = document.getElementById("template-tag-folder") as HTMLTemplateElement
  const clone = template.content.cloneNode(true) as DocumentFragment
  const li = clone.querySelector("li") as HTMLLIElement
  const folderContainer = li.querySelector(".tag-folder-container") as HTMLElement
  const titleLink = folderContainer.querySelector(".tag-folder-title") as HTMLAnchorElement
  const folderOuter = li.querySelector(".tag-folder-outer") as HTMLElement
  const ul = folderOuter.querySelector("ul") as HTMLUListElement

  const fullPath = pathPrefix ? `${pathPrefix}/${node.name}` : node.name
  folderContainer.dataset.tagpath = fullPath

  titleLink.href = resolveRelative(currentSlug, `tags/${fullPath}` as FullSlug)
  titleLink.dataset.for = `tags/${fullPath}`
  titleLink.textContent = `${node.name} (${node.count})`

  if (currentSlug === `tags/${fullPath}` || currentSlug === fullPath) {
    folderContainer.classList.add("active")
  }

  // Determine if collapsed
  const saved = useSavedState
    ? currentTagState.find(item => item.path === fullPath)
    : undefined
  const isCollapsed = saved?.collapsed ?? folderDefaultState === "collapsed"

  // Open if current slug is under this tag
  const slugIsUnderThisTag = currentSlug.startsWith(`tags/${fullPath}`)
  if (!isCollapsed || slugIsUnderThisTag) {
    folderOuter.classList.add("open")
  }

  // Build children - sort folders first, then articles
  const childFolders = Object.values(node.children).sort((a, b) => {
    const aIsFolder = Object.keys(a.children).length > 0
    const bIsFolder = Object.keys(b.children).length > 0
    if (aIsFolder !== bIsFolder) return bIsFolder ? 1 : -1
    return a.name.localeCompare(b.name)
  })

  for (const child of childFolders) {
    const childNode = createTagFolderNode(currentSlug, child, fullPath)
    ul.appendChild(childNode)
  }

  // Add articles
  for (const article of node.articles) {
    const articleNode = createArticleNode(currentSlug, article)
    ul.appendChild(articleNode)
  }

  return li
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

async function setupTagExplorer(currentSlug: FullSlug) {
  const allTagExplorers = document.querySelectorAll("div.tag-explorer") as NodeListOf<HTMLElement>

  for (const explorer of allTagExplorers) {
    // Load saved state
    const storageTree = useSavedState ? localStorage.getItem("tagTreeState") : null
    const oldIndex = new Map<string, boolean>()
    if (storageTree) {
      const parsed = JSON.parse(storageTree)
      for (const entry of parsed) {
        oldIndex.set(entry.path, entry.collapsed)
      }
      currentTagState = parsed
    }

    // Fetch data
    const data = await fetchData as Record<string, ContentDetails>
    const tree = buildTagTree(data)

    const explorerUl = explorer.querySelector(".tag-ul")
    if (!explorerUl) continue

    // Clear existing content
    explorerUl.innerHTML = ""

    // Sort root tags by count descending
    const sortedRootKeys = Object.keys(tree.children).sort(
      (a, b) => tree.children[b].count - tree.children[a].count,
    )

    // Create and insert nodes
    const fragment = document.createDocumentFragment()
    for (const key of sortedRootKeys) {
      const node = createTagFolderNode(currentSlug, tree.children[key], "")
      fragment.appendChild(node)
    }
    explorerUl.appendChild(fragment)

    // Set up event handlers for folder toggles
    const folderIcons = explorer.getElementsByClassName("tag-folder-icon") as HTMLCollectionOf<HTMLElement>
    for (const icon of folderIcons) {
      icon.addEventListener("click", toggleTagFolder)
      window.addCleanup(() => icon.removeEventListener("click", toggleTagFolder))
    }

    const folderTitles = explorer.getElementsByClassName("tag-folder-container") as HTMLCollectionOf<HTMLElement>
    for (const container of folderTitles) {
      container.addEventListener("click", toggleTagFolder)
      window.addCleanup(() => container.removeEventListener("click", toggleTagFolder))
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

  // Scroll to active
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
