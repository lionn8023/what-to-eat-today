import React, { useState, useMemo } from 'react'
import styles from './Wheel.module.css'

const COLORS = [
  '#ff4d8d',
  '#ffc72c',
  '#3b82f6',
  '#ff7eb3',
  '#ffe066',
  '#60a5fa',
  '#ff4d8d',
  '#ffc72c',
  '#3b82f6',
  '#ff7eb3',
  '#ffe066',
  '#60a5fa',
]

// 旋转动画时长：CSS 过渡与 JS 判定共用同一常量，避免改一处忘另一处
const SPIN_DURATION_MS = 4000
// 动画结束后留一点缓冲再揭晓结果
const SPIN_REVEAL_DELAY_MS = 200

export default function Wheel({ shops, onClose, onSelectShop, onHighlight }) {
  // 公平起见：从全部结果中随机抽取 12 家进入转盘，而非固定取前 12 家。
  // Wheel 每次打开都会重新挂载，因此每次打开都是一次全新的随机取样。
  const displayShops = useMemo(() => {
    const list = Array.isArray(shops) ? shops : []
    if (list.length <= 12) return list
    const pool = [...list]
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[pool[i], pool[j]] = [pool[j], pool[i]]
    }
    return pool.slice(0, 12)
  }, [shops])
  const segmentAngle = 360 / displayShops.length
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [winner, setWinner] = useState(null)

  function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    }
  }

  function describeArc(cx, cy, r, startAngle, endAngle) {
    const start = polarToCartesian(cx, cy, r, endAngle)
    const end = polarToCartesian(cx, cy, r, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1'
    return [
      'M',
      cx,
      cy,
      'L',
      start.x,
      start.y,
      'A',
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
      'Z',
    ].join(' ')
  }

  function handleSpin() {
    if (spinning || displayShops.length === 0) return

    setSpinning(true)
    setWinner(null)

    const winnerIndex = Math.floor(Math.random() * displayShops.length)
    const fullSpins = 5 + Math.floor(Math.random() * 3)
    const targetAngle = winnerIndex * segmentAngle + segmentAngle / 2

    setRotation((prev) => {
      const next =
        prev +
        fullSpins * 360 +
        (360 - (prev % 360) - targetAngle) % 360
      return next
    })

    setTimeout(() => {
      const winnerShop = displayShops[winnerIndex]
      setSpinning(false)
      setWinner(winnerShop)
      // 转盘一停，立刻通知地图飞到赢家位置（用户关闭转盘后地图已就位）
      onHighlight?.(winnerShop)
    }, SPIN_DURATION_MS + SPIN_REVEAL_DELAY_MS)
  }

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>

        <h2 className={styles.title}>命运大转盘</h2>

        <div className={styles.wheelWrap}>
          <div className={styles.pointer}>▼</div>
          <svg
            className={styles.wheel}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                : 'none',
            }}
            viewBox="0 0 300 300"
          >
            {displayShops.map((shop, index) => {
              const startAngle = index * segmentAngle
              const endAngle = (index + 1) * segmentAngle
              const midAngle = startAngle + segmentAngle / 2
              const textPos = polarToCartesian(150, 150, 90, midAngle)
              const color = COLORS[index % COLORS.length]

              return (
                <g key={shop.id || index}>
                  <path
                    d={describeArc(150, 150, 140, startAngle, endAngle)}
                    fill={color}
                    stroke="#1a1a1a"
                    strokeWidth="3"
                  />
                  <text
                    x={textPos.x}
                    y={textPos.y}
                    fill="#1a1a1a"
                    fontSize="12"
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {shop.name.length > 5
                      ? shop.name.slice(0, 5) + '…'
                      : shop.name}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>

        <button
          className={styles.spinBtn}
          onClick={handleSpin}
          disabled={spinning}
        >
          {spinning ? '转动中…' : '开始转动'}
        </button>

        {winner && (
          <div
            className={styles.result}
            onClick={() => onSelectShop(winner)}
            role="button"
            tabIndex={0}
          >
            <p className={styles.resultLabel}>今天就去吃（点击查看详情）</p>
            <h3 className={styles.resultName}>{winner.name}</h3>
            <p className={styles.resultAddress}>{winner.address}</p>
          </div>
        )}
      </div>
    </div>
  )
}
