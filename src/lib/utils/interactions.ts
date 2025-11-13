type InteractionSource = {
  userInteractions?: {
    liked?: boolean | null;
    shared?: boolean | null;
    bookmarked?: boolean | null;
    pinned?: boolean | null;
  } | null;
  viewerInteractions?: {
    liked?: boolean | null;
    shared?: boolean | null;
    bookmarked?: boolean | null;
    pinned?: boolean | null;
  } | null;
  viewerState?: {
    liked?: boolean | null;
    shared?: boolean | null;
    bookmarked?: boolean | null;
    pinned?: boolean | null;
  } | null;
  favourited?: boolean | null;
  favorited?: boolean | null;
  liked?: boolean | null;
  reblogged?: boolean | null;
  shared?: boolean | null;
  bookmarked?: boolean | null;
  pinned?: boolean | null;
};

function coalesceBoolean(...values: Array<boolean | null | undefined>): boolean | undefined {
  for (const value of values) {
    if (typeof value === 'boolean') {
      return value;
    }
  }
  return undefined;
}

export function resolveFavouritedFlag(source: InteractionSource | null | undefined): boolean {
  return (
    coalesceBoolean(
      source?.userInteractions?.liked,
      source?.viewerInteractions?.liked,
      source?.viewerState?.liked,
      source?.favourited,
      source?.favorited,
      source?.liked
    ) ?? false
  );
}

export function resolveRebloggedFlag(source: InteractionSource | null | undefined): boolean {
  return (
    coalesceBoolean(
      source?.userInteractions?.shared,
      source?.viewerInteractions?.shared,
      source?.viewerState?.shared,
      source?.reblogged,
      source?.shared
    ) ?? false
  );
}

export function resolveBookmarkedFlag(source: InteractionSource | null | undefined): boolean {
  return (
    coalesceBoolean(
      source?.userInteractions?.bookmarked,
      source?.viewerInteractions?.bookmarked,
      source?.viewerState?.bookmarked,
      source?.bookmarked
    ) ?? false
  );
}

export function resolvePinnedFlag(source: InteractionSource | null | undefined): boolean {
  return (
    coalesceBoolean(
      source?.userInteractions?.pinned,
      source?.viewerInteractions?.pinned,
      source?.viewerState?.pinned,
      source?.pinned
    ) ?? false
  );
}
