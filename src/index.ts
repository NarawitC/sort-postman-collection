/**
 * Main entry point for the Postman collection sorter
 */
import fs, { writeFileSync } from 'fs'
import path from 'path'
import postmanCollection from './asset/postman-collection.json'

interface PostmanRequest {
  method?: string
  header?: Array<{ key: string; value: string }>
  url?: {
    raw: string
    host: string[]
    path: string[]
  }
}

interface PostmanItem {
  name: string
  request?: PostmanRequest
  item?: PostmanItem[]
  response?: any[]
}

interface PostmanCollection {
  item: PostmanItem[]
  info?: {
    name: string
    schema: string
  }
}

const HTTP_METHODS_PRIORITY: { [key: string]: number } = {
  GET: 1,
  POST: 2,
  PUT: 3,
  PATCH: 4,
  DELETE: 5,
}

const sortByMethodAndName = (a: PostmanItem, b: PostmanItem): number => {
  const methodA = a.request?.method?.toUpperCase() || ''
  const methodB = b.request?.method?.toUpperCase() || ''

  // Sort by HTTP method priority first
  const methodPriorityA = HTTP_METHODS_PRIORITY[methodA] || 999
  const methodPriorityB = HTTP_METHODS_PRIORITY[methodB] || 999

  if (methodPriorityA !== methodPriorityB) {
    return methodPriorityA - methodPriorityB
  }

  // If methods are the same or both items don't have methods, sort by name
  return a.name.localeCompare(b.name)
}

const sortPostmanItems = (items: PostmanItem[]): PostmanItem[] => {
  return items.map((folder) => ({
    ...folder,
    item: folder.item?.sort(sortByMethodAndName) || [],
  }))
}

const main = async (): Promise<void> => {
  try {
    console.log('Starting Postman collection sorter...')

    if (!postmanCollection || !Array.isArray(postmanCollection.item)) {
      throw new Error('Invalid Postman collection format')
    }

    // Sort top-level folders by name
    const formattedCollection = sortPostmanItems(
      postmanCollection.item.sort((a, b) => a.name.localeCompare(b.name)),
    )

    const outputPath = 'formatted-collection.json'
    writeFileSync(
      outputPath,
      JSON.stringify(
        {
          ...postmanCollection,
          item: formattedCollection,
        },
        null,
        2,
      ),
    )

    console.log(`Successfully sorted collection and saved to ${outputPath}`)
  } catch (error) {
    console.error(
      'Error:',
      error instanceof Error ? error.message : 'Unknown error occurred',
    )
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(
    'Unhandled error:',
    error instanceof Error ? error.message : 'Unknown error occurred',
  )
  process.exit(1)
})
