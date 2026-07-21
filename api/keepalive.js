// Vercel Serverless Function：定时保活 Supabase 免费项目。
// 免费项目连续 7 天无数据库活动会被自动暂停，这个 daily cron 通过一次轻量查询保持活跃。
// 环境变量 SUPABASE_URL / SUPABASE_ANON_KEY 在服务端配置（Vercel → 项目 Settings → Environment Variables）。
export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_ANON_KEY
  if (!url || !key) {
    return res.status(200).json({ ok: true, skipped: 'Supabase 环境变量未配置，跳过保活' })
  }
  try {
    const r = await fetch(`${url}/rest/v1/favorites?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    })
    return res.status(200).json({ ok: true, supabaseStatus: r.status })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e) })
  }
}
