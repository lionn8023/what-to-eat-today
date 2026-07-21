import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 是否在 .env 中配置了真实的 Supabase 凭据。
// 未配置时整个数据库功能优雅降级：现有「地图/转盘」功能照常工作，
// 登录/收藏/历史入口会自动隐藏，绝不报错白屏。
export const isSupabaseConfigured = Boolean(
  url && anonKey && url !== '你的Supabase项目URL'
)

// anon key 是设计上可公开的前端 key，权限由数据库 RLS 策略控制（见 sql/schema.sql）。
// 切勿把 service_role key 放进 VITE_ 前缀的变量 —— 那会暴露后端权限。
export const supabase = isSupabaseConfigured ? createClient(url, anonKey) : null
