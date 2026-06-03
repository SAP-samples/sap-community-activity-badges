/**
 * Type definitions for the /khoros/user/:scnId response shape.
 * Reflects what the Khoros search-by-author response looks like after
 * srv/util/khoros.js re-shapes it into a {data: <user>} envelope.
 *
 * Optional fields are marked optional because the upstream API has been
 * known to drop fields silently; consumers must defend against missing
 * sub-objects.
 */

export interface KhorosResponse {
  data: KhorosProfile
}

export interface KhorosProfile {
  id?: string
  login?: string
  first_name?: string
  last_name?: string
  view_href?: string
  /** HTML snippet — the user's signature; may contain <img> with a /showcaseBadgesGroups URL. */
  signature?: string
  avatar?: { profile?: string }
  rank?: { name?: string }
  user_badges?: { items?: UserBadgeItem[] }
}

export interface UserBadgeItem {
  earned_date?: string
  badge: BadgeDescriptor
}

export interface BadgeDescriptor {
  id: string
  title?: string
  icon_url?: string
  awarded?: number
}

/** A "selected" slot in the editor — may be empty. */
export interface SelectedBadge {
  id: string | ''
  title: string
  iconUrl: string
}

/** A badge augmented with its current selection state, used by the picker views. */
export interface BadgeWithSelection extends UserBadgeItem {
  selected: boolean
}

/** Typed error returned by useKhoros. */
export class KhorosError extends Error {
  readonly code: 'notFound' | 'network' | 'unexpected'
  readonly status?: number
  constructor(code: KhorosError['code'], message: string, status?: number) {
    super(message)
    this.name = 'KhorosError'
    this.code = code
    this.status = status
  }
}
