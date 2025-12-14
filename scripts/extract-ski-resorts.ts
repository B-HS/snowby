import { writeFileSync, readFileSync, existsSync } from 'fs'

interface SkiResort {
    id: string
    name: string
    nameEn: string
    region: string
    country: string
    bounds: {
        sw: [number, number]
        ne: [number, number]
    }
    center: [number, number]
    source: 'osm' | 'google' | 'manual'
    status: 'active' | 'closed' | 'seasonal'
    osmId?: number
}

interface SkiResortsData {
    version: string
    updatedAt: string
    resorts: SkiResort[]
}

interface OSMElement {
    type: string
    id: number
    tags?: {
        name?: string
        'name:en'?: string
        'name:ko'?: string
    }
    bounds?: {
        minlat: number
        minlon: number
        maxlat: number
        maxlon: number
    }
    geometry?: Array<{ lat: number; lon: number }>
}

const OUTPUT_PATH = '../snowby-backend/data/ski-resorts.json'

const extractBoundsFromGeometry = (geometry: Array<{ lat: number; lon: number }>) => {
    const lats = geometry.map((g) => g.lat)
    const lons = geometry.map((g) => g.lon)
    return {
        sw: [Math.min(...lons), Math.min(...lats)] as [number, number],
        ne: [Math.max(...lons), Math.max(...lats)] as [number, number],
    }
}

const calculateCenter = (bounds: { sw: [number, number]; ne: [number, number] }): [number, number] => {
    return [(bounds.sw[0] + bounds.ne[0]) / 2, (bounds.sw[1] + bounds.ne[1]) / 2]
}

const generateId = (name: string) => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

export const extractFromOSM = async (country: string = '대한민국'): Promise<SkiResort[]> => {
    const query = `
[out:json][timeout:120];
area["name"="${country}"]->.searchArea;
(
  way["landuse"="winter_sports"](area.searchArea);
  relation["landuse"="winter_sports"](area.searchArea);
);
out geom;
`.trim()

    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`

    console.log(`🔍 Fetching ski resorts from OSM for ${country}...`)

    const response = await fetch(url)
    const data = (await response.json()) as { elements: OSMElement[] }

    const resorts: SkiResort[] = []

    for (const element of data.elements) {
        const name = element.tags?.name || element.tags?.['name:ko']
        if (!name) continue

        let bounds: { sw: [number, number]; ne: [number, number] }

        if (element.bounds) {
            bounds = {
                sw: [element.bounds.minlon, element.bounds.minlat],
                ne: [element.bounds.maxlon, element.bounds.maxlat],
            }
        } else if (element.geometry) {
            bounds = extractBoundsFromGeometry(element.geometry)
        } else {
            continue
        }

        const center = calculateCenter(bounds)
        const resort: SkiResort = {
            id: generateId(name),
            name,
            nameEn: element.tags?.['name:en'] || name,
            region: detectRegion(center),
            country: country === '대한민국' ? 'KR' : country,
            bounds,
            center,
            source: 'osm',
            status: 'active',
            osmId: element.id,
        }

        resorts.push(resort)
        console.log(`  ✅ ${resort.name} (${resort.id})`)
    }

    console.log(`\n📦 Found ${resorts.length} resorts from OSM`)
    return resorts
}

const detectRegion = (center: [number, number]): string => {
    const [lng, lat] = center

    if (lat >= 37.5 && lng >= 128.0) return '강원특별자치도'
    if (lat >= 37.0 && lat < 37.5 && lng >= 128.0) return '강원특별자치도'
    if (lat >= 37.0 && lng < 128.0 && lng >= 127.0) return '경기도'
    if (lat < 36.0 && lng >= 127.5) return '전북특별자치도'
    if (lat < 36.0 && lng >= 128.5) return '경상남도'

    return '기타'
}

export const addFromGoogleMaps = (
    name: string,
    nameEn: string,
    region: string,
    swLat: number,
    swLng: number,
    neLat: number,
    neLng: number,
    country: string = 'KR'
): SkiResort => {
    const bounds = {
        sw: [swLng, swLat] as [number, number],
        ne: [neLng, neLat] as [number, number],
    }

    return {
        id: generateId(name),
        name,
        nameEn,
        region,
        country,
        bounds,
        center: calculateCenter(bounds),
        source: 'google',
        status: 'active',
    }
}

export const addManualResort = (
    id: string,
    name: string,
    nameEn: string,
    region: string,
    bounds: { sw: [number, number]; ne: [number, number] },
    country: string = 'KR'
): SkiResort => {
    return {
        id,
        name,
        nameEn,
        region,
        country,
        bounds,
        center: calculateCenter(bounds),
        source: 'manual',
        status: 'active',
    }
}

const loadExisting = (): SkiResortsData => {
    if (existsSync(OUTPUT_PATH)) {
        const content = readFileSync(OUTPUT_PATH, 'utf-8')
        return JSON.parse(content) as SkiResortsData
    }
    return { version: '1.0.0', updatedAt: new Date().toISOString(), resorts: [] }
}

const incrementVersion = (version: string): string => {
    const parts = version.split('.').map(Number)
    parts[2]++
    return parts.join('.')
}

const saveResorts = (resorts: SkiResort[], existingData: SkiResortsData) => {
    const sorted = resorts.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
    const data: SkiResortsData = {
        version: incrementVersion(existingData.version),
        updatedAt: new Date().toISOString(),
        resorts: sorted,
    }
    writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`\n💾 Saved ${resorts.length} resorts to ${OUTPUT_PATH}`)
    console.log(`📦 Version: ${data.version}`)
}

const mergeResorts = (existing: SkiResort[], newResorts: SkiResort[]): SkiResort[] => {
    const merged = new Map<string, SkiResort>()

    for (const resort of existing) {
        merged.set(resort.id, resort)
    }

    for (const resort of newResorts) {
        if (!merged.has(resort.id)) {
            merged.set(resort.id, resort)
        }
    }

    return Array.from(merged.values())
}

const MANUAL_RESORTS: SkiResort[] = [
    addManualResort(
        'muju-deogyusan',
        '무주덕유산리조트',
        'Muju Deogyusan Resort',
        '전북특별자치도',
        { sw: [127.738, 35.864], ne: [127.778, 35.897] }
    ),
    addManualResort(
        'elysian-gangchon',
        '엘리시안강촌',
        'Elysian Gangchon',
        '강원특별자치도',
        { sw: [127.544, 37.804], ne: [127.566, 37.822] }
    ),
    addManualResort(
        'welli-hilli',
        '웰리힐리파크',
        'Welli Hilli Park',
        '강원특별자치도',
        { sw: [128.242, 37.488], ne: [128.272, 37.512] }
    ),
    addManualResort(
        'eden-valley',
        '에덴밸리리조트',
        'Eden Valley Resort',
        '경상남도',
        { sw: [128.988, 35.458], ne: [129.018, 35.482] }
    ),
    addManualResort(
        'starhill',
        '스타힐리조트',
        'Star Hill Resort',
        '강원특별자치도',
        { sw: [127.892, 37.378], ne: [127.918, 37.398] }
    ),
]

const main = async () => {
    const args = process.argv.slice(2)
    const command = args[0]

    switch (command) {
        case 'osm': {
            const country = args[1] || '대한민국'
            const osmResorts = await extractFromOSM(country)
            const existingData = loadExisting()
            const merged = mergeResorts(existingData.resorts, osmResorts)
            saveResorts(merged, existingData)
            break
        }

        case 'manual': {
            const existingData = loadExisting()
            const merged = mergeResorts(existingData.resorts, MANUAL_RESORTS)
            saveResorts(merged, existingData)
            console.log('\n📝 Added manual resorts:')
            MANUAL_RESORTS.forEach((r) => console.log(`  - ${r.name}`))
            break
        }

        case 'all': {
            const existingData = loadExisting()
            const osmResorts = await extractFromOSM('대한민국')
            const merged = mergeResorts(osmResorts, MANUAL_RESORTS)
            saveResorts(merged, existingData)
            break
        }

        case 'list': {
            const data = loadExisting()
            console.log(`\n📋 Current resorts (${data.resorts.length}):`)
            console.log(`📦 Version: ${data.version}`)
            console.log(`🕐 Updated: ${data.updatedAt}\n`)
            data.resorts.forEach((r) => {
                console.log(`  [${r.source}] ${r.name} (${r.id}) - ${r.region}`)
            })
            break
        }

        default:
            console.log(`
🎿 Ski Resort Extractor

Usage:
  bun scripts/extract-ski-resorts.ts <command>

Commands:
  osm [country]  - Extract from OpenStreetMap (default: 대한민국)
  manual         - Add manually defined resorts
  all            - Extract OSM + add manual resorts
  list           - List current resorts

Examples:
  bun scripts/extract-ski-resorts.ts osm
  bun scripts/extract-ski-resorts.ts osm 日本
  bun scripts/extract-ski-resorts.ts manual
  bun scripts/extract-ski-resorts.ts all
`)
    }
}

main().catch(console.error)
