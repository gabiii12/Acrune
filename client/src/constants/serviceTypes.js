// Filter buttons on a platform's service list. A service gets the type whose keyword
// appears first in its name/category ("Followers + Likes" -> Followers).
export const SERVICE_TYPES = [
  ['Followers', /follower|subscriber|member/],
  ['Likes', /like|reaction/],
  ['Views', /view|watch|impression/],
  ['Shares', /share|repost|retweet/],
  ['Comments', /comment/],
]
export const TYPE_LABELS = [...SERVICE_TYPES.map(([label]) => label), 'Other']

export function serviceType(s) {
  const text = `${s.name} ${s.category}`.toLowerCase()
  let best = 'Other', pos = Infinity
  for (const [label, re] of SERVICE_TYPES) {
    const at = text.search(re)
    if (at !== -1 && at < pos) { pos = at; best = label }
  }
  return best
}
