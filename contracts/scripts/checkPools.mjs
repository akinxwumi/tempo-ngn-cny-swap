import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createPublicClient, formatUnits, http } from 'viem'
import { tempoModerato } from 'viem/chains'
import { Actions, Tick } from 'viem/tempo'
import { readAddressBook } from '../lib/addressBook.mjs'
import { DEFAULT_RPC_URL, DEFAULT_VALIDATOR_TOKEN } from '../lib/tempoClient.mjs'

const DECIMALS = 6
const REFRESH_INTERVAL_MS = 5_000
const DEX_FAIR_PRICE = 1
const DEX_SPREAD_BPS = 30
const SELL_PRICE = Number((DEX_FAIR_PRICE * (1 + DEX_SPREAD_BPS / 10_000)).toFixed(5))
const BUY_PRICE = Number((DEX_FAIR_PRICE * (1 - DEX_SPREAD_BPS / 10_000)).toFixed(5))
const SELL_TICK = Tick.fromPrice(SELL_PRICE.toFixed(5))
const BUY_TICK = Tick.fromPrice(BUY_PRICE.toFixed(5))

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(scriptDir, '..', '..')
const addressBook = readAddressBook(projectRoot)

const tokens = [
  { name: 'NGN', address: addressBook.ngnTokenAddress },
  { name: 'CNY', address: addressBook.cnyTokenAddress },
].filter((token) => token.address)

if (!tokens.length) {
  console.error('address.json is empty or missing NGN/CNY entries. Fill it before running.')
  process.exit(1)
}

const quoteToken = DEFAULT_VALIDATOR_TOKEN
const client = createPublicClient({
  chain: tempoModerato,
  transport: http(DEFAULT_RPC_URL),
})

let snapshotCount = 0

function formatAddress(address) {
  if (!address) return 'N/A'
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

async function fetchTickSnapshot(baseToken, tick, isBid) {
  try {
    const level = await Actions.dex.getTickLevel(client, {
      base: baseToken,
      tick,
      isBid,
    })
    const orders = []
    let pointer = level.head
    let safety = 0
    while (pointer !== 0n && safety < 256) {
      const order = await Actions.dex.getOrder(client, { orderId: pointer })
      if (order.isFlip) {
        orders.push(order)
      }
      pointer = order.next
      safety += 1
    }
    if (safety >= 256) {
      console.warn('  truncated order list after 256 entries to avoid infinite loop')
    }
    return { level, orders }
  } catch (err) {
    console.warn('  failed to snapshot tick', err?.message ?? err)
    return { level: null, orders: [] }
  }
}

function buildTickRows(orderbook) {
  const ticks = new Map()
  const addTick = (label, tick, isBid) => {
    if (typeof tick !== 'number') return
    const key = `${tick}:${isBid ? 'bid' : 'ask'}`
    if (!ticks.has(key)) {
      ticks.set(key, { label, tick, isBid })
    }
  }

  addTick('configured sell', SELL_TICK, false)
  addTick('configured buy', BUY_TICK, true)
  if (orderbook) {
    addTick('best bid', orderbook.bestBidTick, true)
    addTick('best ask', orderbook.bestAskTick, false)
  }

  return Array.from(ticks.values())
}

function normalizeBigInt(value) {
  return value ?? 0n
}

function formatLiquidity(value) {
  return formatUnits(normalizeBigInt(value), DECIMALS)
}

function describeOrders(orders) {
  if (!orders.length) return 'no flip orders'
  const lines = ['    order   maker           side  price     amount     remaining   flip-price  status']
  for (const order of orders) {
    const price = Tick.toPrice(order.tick)
    const flipPrice = Tick.toPrice(order.flipTick)
    const remaining = formatUnits(order.remaining, DECIMALS)
    const amount = formatUnits(order.amount, DECIMALS)
    const side = order.isBid ? 'BUY ' : 'SELL'
    const status = order.remaining === order.amount
      ? 'pending'
      : order.remaining === 0n
        ? 'filled'
        : 'partial'
    const line = `    ${order.orderId.toString().padEnd(7)} ${formatAddress(order.maker).padEnd(14)} ${side.padEnd(4)} ${price.padEnd(9)} ${amount.padEnd(10)} ${remaining.padEnd(10)} ${flipPrice.padEnd(10)} ${status}`
    lines.push(line)
  }
  return lines.join('\n')
}

async function renderSnapshot() {
  const now = new Date().toISOString()
  snapshotCount += 1
  console.log(`\n\n=== Flip-order snapshot #${snapshotCount} • ${now} ===`)
  for (const token of tokens) {
    console.log('\n------------------------------------------------------------')
    console.log(`${token.name} • ${token.address}`)
    try {
      const pool = await Actions.amm.getPool(client, {
        userToken: token.address,
        validatorToken: quoteToken,
      })
      console.log(`  Pool reserves: user ${formatLiquidity(pool.reserveUserToken)} / validator ${formatLiquidity(pool.reserveValidatorToken)}`)
    } catch (err) {
      console.warn('  pool lookup failed', err?.message ?? err)
    }

    let orderbook
    try {
      orderbook = await Actions.dex.getOrderbook(client, {
        base: token.address,
        quote: quoteToken,
      })
      console.log(`  Best ticks: bid=${orderbook.bestBidTick} ask=${orderbook.bestAskTick}`)
    } catch (err) {
      console.warn('  orderbook lookup failed', err?.message ?? err)
    }

    const tickRows = buildTickRows(orderbook)
    for (const row of tickRows) {
      const tickPrice = Tick.toPrice(row.tick)
      process.stdout.write(`\n  [${row.label}] ${row.isBid ? 'bid' : 'ask'} tick=${row.tick} price=${tickPrice}`)
      const snapshot = await fetchTickSnapshot(token.address, row.tick, row.isBid)
      const liquidity = snapshot.level?.totalLiquidity ?? 0n
      process.stdout.write(` liquidity=${formatLiquidity(liquidity)}
`)
      const description = describeOrders(snapshot.orders)
      if (description) console.log(description)
    }
  }
}

let refreshInProgress = false

async function refreshDisplay() {
  if (refreshInProgress) return
  refreshInProgress = true
  try {
    await renderSnapshot()
  } catch (err) {
    console.error('render failed', err)
  } finally {
    refreshInProgress = false
  }
}

async function main() {
  await refreshDisplay()
  setInterval(refreshDisplay, REFRESH_INTERVAL_MS)
}

main()
