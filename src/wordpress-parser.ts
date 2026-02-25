import { load, type Cheerio } from "cheerio"
import { mkdir } from "node:fs/promises"
import { loadConfig } from "./config"
import TurndownService from "turndown"

let config: Awaited<ReturnType<typeof loadConfig>> | null = null

const getConfig = async () => {
  if (!config) {
    config = await loadConfig()
  }
  return config
}

export interface PostInfo {
  title: string
  url: string
  date: Date | null
  content?: string
}

export interface PostGroup {
  date: Date
  posts: PostInfo[]
}

const SELECTORS = {
  post: 'article[id^="post-"]',
  header: "header",
  link: "header a",
}

const fetchWithRetry = async (
  url: string,
  options: RequestInit = {},
  attempts: number = 3,
): Promise<Response> => {
  for (let i = 0; i < attempts; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; AzurLanePatchParser/1.0)",
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      return response
    } catch (error) {
      if (i === attempts - 1) {
        throw new Error(
          `Failed to fetch ${url} after ${attempts} attempts: ${error}`,
        )
      }

      const delay = 1000 * Math.pow(2, i)
      console.log(`⚠️ Retry ${i + 1}/${attempts} in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw new Error(`Failed to fetch ${url} after ${attempts} attempts`)
}

const parseDate = (text: string): Date | null => {
  const patterns = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    /(January|February|March|April|May|June|July|August|September|October|November|December) (\d{1,2}), (\d{4})/gi,
    /Posted on (.+?)(?:\.|$)/gi,
    /<time[^>]+datetime=["']([^"']+)["']/gi,
  ]

  const dates: Date[] = []

  for (const pattern of patterns) {
    const matches = text.matchAll(pattern)

    for (const match of matches) {
      try {
        let dateStr: string

        if (match[1] && match[2] && match[3]) {
          const month = match[1]
          const day = match[2]
          const year = match[3]

          const monthNum = isNaN(Number.parseInt(month, 10))
            ? new Date(`${month} 1, 2000`).getMonth() + 1
            : Number.parseInt(month, 10)

          dateStr = `${year}-${monthNum.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`
        } else if (match[1]) {
          dateStr = match[1]
        } else {
          continue
        }

        const date = new Date(dateStr)
        if (!isNaN(date.getTime())) {
          dates.push(date)
        }
      } catch {}
    }
  }

  if (dates.length === 0) {
    return null
  }

  return dates.reduce((latest, current) =>
    current > latest ? current : latest,
  )
}

const cleanHTML = (
  html: string,
  options?: { includeSkins?: boolean },
): string => {
  const $ = load(html)
  const includeSkins = options?.includeSkins ?? true

  // Remove unwanted elements
  $("img, video, iframe, style, script, noscript").remove()
  const removeSelectors = [
    ".ad",
    ".advertisement",
    ".sidebar",
    ".footer",
    ".navigation",
    ".menu",
    ".header-image",
  ]
  if (!includeSkins) {
    removeSelectors.push(".wp-block-verse")
  }
  $(removeSelectors.join(", ")).remove()

  // Remove image captions
  $(".wp-caption-text, .gallery-caption").remove()

  // Remove all classes, styles, ids, and data-* attributes
  $("*").each((_index: number, element: any) => {
    const $el = $(element)
    $el.removeAttr("class")
    $el.removeAttr("style")
    $el.removeAttr("id")
    // Remove data-* attributes
    if ("attribs" in element && element.attribs) {
      Object.keys(element.attribs).forEach((attr) => {
        if (attr.startsWith("data-")) {
          $el.removeAttr(attr)
        }
      })
    }
  })

  const contentSelectors = [
    ".entry-content",
    "article .post-content",
    ".content-area",
    "main",
    "article div:nth-child(2)",
  ]

  for (const selector of contentSelectors) {
    const element = $(selector)
    if (element.length > 0) {
      return element.html() || ""
    }
  }

  return $("article").html() || ""
}

const htmlToMarkdown = (html: string): string => {
  const turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
    strongDelimiter: "**",
    emDelimiter: "*",
    linkStyle: "inlined",
    blankReplacement: (content, node: any) => (node.isBlock ? "\n\n" : ""),
  })

  turndownService.addRule("removeImages", {
    filter: ["img"],
    replacement: () => "",
  })

  const markdown = turndownService.turndown(html)

  return markdown.replace(/\n{3,}/g, "\n\n")
}

const parseListingPage = (html: string): PostInfo[] => {
  const $ = load(html)
  const posts: PostInfo[] = []

  $(SELECTORS.post).each((_index: number, element: any) => {
    const $element = $(element)
    const headerElement = $element.find(SELECTORS.header)
    const linkElement = headerElement.find(SELECTORS.link)
    const rawTitle = linkElement.text().trim()
    const title = rawTitle
      .replace(
        /^(?:Posted on )?(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}(?:(January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4})?/gi,
        "",
      )
      .trim()
    const link = linkElement.attr("href")

    if (!title || !link) {
      return
    }

    const date = extractLatestDate(headerElement)

    posts.push({
      title,
      url: link,
      date,
    })
  })

  return posts
}

const extractLatestDate = (headerElement: Cheerio<any>): Date | null => {
  const html = headerElement.html()
  if (!html) return null
  const date = parseDate(html)

  if (!date) {
    console.warn("⚠️ Could not extract date from header")
  }

  return date
}

const fetchPostContent = async (
  url: string,
  options?: { includeSkins?: boolean },
): Promise<string> => {
  const html = await fetchWithRetry(url)
  const text = await html.text()
  return extractMainContent(text, options)
}

const extractMainContent = (
  html: string,
  options?: { includeSkins?: boolean },
): string => {
  const cleanedHTML = cleanHTML(html, options)
  return htmlToMarkdown(cleanedHTML)
}

/**
 * Crawls WordPress blog from BASE_URL, fetching posts until EARLIEST_DATE.
 * Returns posts sorted by date (newest first).
 */
export const crawlBlog = async (): Promise<PostInfo[]> => {
  const cfg = await getConfig()
  const earliestDate = new Date(cfg.wordpress.earliestDate)
  const allPosts: PostInfo[] = []
  let page = 1
  let cutoffReached = false

  while (!cutoffReached) {
    console.log(`📰 Crawling page ${page}...`)

    const url =
      page === 1
        ? cfg.wordpress.baseUrl
        : `${cfg.wordpress.baseUrl}${cfg.wordpress.pageAppendUrl}${page}`

    const html = await fetchWithRetry(url)
    const text = await html.text()
    const posts = parseListingPage(text)

    if (posts.length === 0) {
      console.log(`✓ No more posts found`)
      break
    }

    for (const post of posts) {
      if (post.date === null) {
        console.log(`⚠️ Skipping post without date: ${post.title}`)
        continue
      }

      if (post.date <= earliestDate) {
        console.log(
          `✓ Date cutoff reached: ${post.date.toISOString().split("T")[0]}`,
        )
        cutoffReached = true
        break
      }

      console.log(`  → Fetching: ${post.title}`)
      post.content = await fetchPostContent(post.url, {
        includeSkins: cfg.detailedSkin,
      })
      allPosts.push(post)
    }

    page++
  }

  return allPosts.sort((a, b) => {
    if (a.date === null || b.date === null) return 0
    return b.date.getTime() - a.date.getTime()
  })
}

const ensureDir = async (path: string): Promise<void> => {
  try {
    await mkdir(path, { recursive: true })
  } catch (error) {
    if ((error as any).code !== "EEXIST") {
      throw error
    }
  }
}

/**
 * Groups posts by date.
 */
export const groupPostsByDate = (posts: PostInfo[]): PostGroup[] => {
  const groups = new Map<string, PostInfo[]>()

  for (const post of posts) {
    if (!post.date) continue
    const dateStr = post.date.toISOString().split("T")[0]
    if (dateStr && !groups.has(dateStr)) {
      groups.set(dateStr, [])
    }
    if (dateStr) {
      groups.get(dateStr)!.push(post)
    }
  }

  return Array.from(groups.entries())
    .map(([dateStr, posts]) => ({
      date: new Date(dateStr),
      posts: posts.sort((a, b) => b.date!.getTime() - a.date!.getTime()),
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime())
}

/**
 * Formats a single date's posts for processing.
 */
export const formatPostGroup = (group: PostGroup): string => {
  const dateStr = group.date.toISOString().split("T")[0]
  let content = ""

  for (const post of group.posts) {
    const separator = [
      "",
      "─".repeat(40),
      `DATE: ${dateStr}`,
      `TITLE: ${post.title}`,
      "─".repeat(40),
      "",
      post.content || "",
      "",
      "",
    ].join("\n")

    content += separator
  }

  return content
}

/**
 * Writes a single date's raw content to PATCH_NOTES_DIR/YYYY-MM-DD_content.md.
 * Overwrites existing file if it exists.
 */
export const writePostGroupContent = async (
  content: string,
  date: Date,
): Promise<void> => {
  const cfg = await getConfig()
  const dateStr = date.toISOString().split("T")[0]
  const filename = `${cfg.patchNotesDir}/${dateStr}_content.md`

  await ensureDir(cfg.patchNotesDir)

  await Bun.write(filename, content)
  console.log(`  ✓ Saved raw content: ${filename}`)
}
