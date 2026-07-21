import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import styles from './AuthModal.module.css'

export default function AuthModal({ onClose }) {
  const { signInWithPassword, signUp, signInWithMagicLink } = useAuth()
  const [mode, setMode] = useState('signin') // signin | signup | magic
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setInfo('')
    setBusy(true)
    try {
      if (mode === 'magic') {
        await signInWithMagicLink(email)
        setInfo('登录链接已发送到邮箱，请查收并点击完成登录 📧')
      } else if (mode === 'signin') {
        await signInWithPassword(email, password)
        onClose()
      } else {
        await signUp(email, password)
        setInfo('注册成功！如开启邮箱验证，请查收确认邮件；否则已自动登录。')
        onClose()
      }
    } catch (err) {
      setError(err.message || '操作失败，请重试')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>
          ×
        </button>
        <h2 className={styles.title}>登录 / 注册</h2>
        <p className={styles.subtitle}>登录后收藏与抽签历史可跨设备同步</p>

        <div className={styles.tabs}>
          <button
            className={mode === 'signin' ? styles.tabActive : styles.tab}
            onClick={() => {
              setMode('signin')
              setError('')
              setInfo('')
            }}
          >
            密码登录
          </button>
          <button
            className={mode === 'signup' ? styles.tabActive : styles.tab}
            onClick={() => {
              setMode('signup')
              setError('')
              setInfo('')
            }}
          >
            注册
          </button>
          <button
            className={mode === 'magic' ? styles.tabActive : styles.tab}
            onClick={() => {
              setMode('magic')
              setError('')
              setInfo('')
            }}
          >
            魔法链接
          </button>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <input
            className={styles.input}
            type="email"
            required
            placeholder="邮箱"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {mode !== 'magic' && (
            <input
              className={styles.input}
              type="password"
              required
              minLength={6}
              placeholder="密码（至少 6 位）"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          )}
          <button className={styles.submit} type="submit" disabled={busy}>
            {busy
              ? '处理中…'
              : mode === 'magic'
              ? '发送登录链接'
              : mode === 'signup'
              ? '注册并登录'
              : '登录'}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}
        {info && <p className={styles.info}>{info}</p>}
      </div>
    </div>
  )
}
