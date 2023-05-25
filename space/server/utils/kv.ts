import { createStorage, prefixStorage } from 'unstorage'
import type { Storage } from 'unstorage'
import fsDriver from 'unstorage/drivers/fs'
import cloudflareKVBindingDriver from 'unstorage/drivers/cloudflare-kv-binding'

let _kv: Storage

export function useKV (prefix?: string) {
  const config = useRuntimeConfig().kv

  if (!_kv) {
    if (process.env.KV) {
      _kv = createStorage({
        driver: cloudflareKVBindingDriver({
          binding: process.env.KV
        })
      })
    } else {
      _kv = createStorage({
        driver: fsDriver({ base: config.dir })
      })
    }
  }
  
  if (prefix) {
    return prefixStorage(_kv, prefix)
  }

  return _kv
}
